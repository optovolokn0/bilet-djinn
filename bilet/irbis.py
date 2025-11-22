import argparse
import cbsvibpyirbis as irbis
import sys
import time
import inspect
import os
import json
from pathlib import Path


def record_to_text(record):
    """Try to convert various record representations to readable text.

    This function uses a few heuristics to support bytes, strings,
    dict-like and MARC-like objects that the `cbsvibpyirbis` client may
    return.
    """
    # object with to_text
    if hasattr(record, 'to_text'):
        try:
            return record.to_text()
        except Exception:
            pass

    # bytes
    if isinstance(record, (bytes, bytearray)):
        for enc in ('utf-8', 'cp1251', 'latin1'):
            try:
                s = record.decode(enc)
                break
            except Exception:
                s = record.decode('utf-8', errors='replace')
        # IRBIS often uses ASCII 0x1F as subfield separator
        s = s.replace('\x1f', '^')
        return s

    # plain string
    if isinstance(record, str):
        return record.replace('\x1f', '^')

    # object with fields attribute (common MARC-like wrapper)
    if hasattr(record, 'fields'):
        lines = []
        try:
            fields = record.fields
            for f in fields:
                tag = getattr(f, 'tag', None) or (f.get('tag') if isinstance(f, dict) else None)
                value = getattr(f, 'value', None) or (f.get('value') if isinstance(f, dict) else None)
                if value is None:
                    # try subfields
                    subs = getattr(f, 'subfields', None) or (f.get('subfields') if isinstance(f, dict) else None)
                    if subs:
                        if isinstance(subs, dict):
                            subparts = [f'${k}{v}' for k, v in subs.items()]
                        else:
                            # list of (code, value) pairs
                            subparts = [f'${code}{val}' for code, val in subs]
                        value = ' '.join(subparts)
                    else:
                        value = str(f)
                lines.append(f'{tag}: {value}')
            return '\n'.join(lines)
        except Exception:
            pass

    # dict-like record
    if isinstance(record, dict):
        try:
            return '\n'.join(f'{k}: {v}' for k, v in record.items())
        except Exception:
            return str(record)

    # fallback
    return str(record)


def dump_server_capabilities(client, out_meta_path):
    try:
        with open(out_meta_path, 'w', encoding='utf-8') as m:
            m.write('=== CLIENT ATTRS ===\n')
            for name in sorted(dir(client)):
                m.write(name + '\n')
            m.write('\n=== PROBING COMMON METHODS ===\n')

            probes = [
                'get_server_version',
                'server_version',
                'get_version',
                'version',
                'list_databases',
                'get_databases',
                'list_formats',
                'get_formats',
                'get_max_mfn',
                'max_mfn',
                'read_raw_record',
                'read_record',
                'read_records',
                'format_record',
                'read_record_header',
            ]

            # helper to build safe args for a callable based on parameter names
            def build_args_for(func_name, func):
                sig = None
                try:
                    sig = inspect.signature(func)
                except Exception:
                    return []
                args = []
                for p in sig.parameters.values():
                    name = p.name.lower()
                    if 'spec' in name or 'specification' in name:
                        args.append('')
                    elif 'record' in name:
                        # try a real record if possible, else pass empty dict
                        try:
                            if hasattr(client, 'read_record'):
                                rec = client.read_record(1)
                                args.append(rec)
                            else:
                                args.append({})
                        except Exception:
                            args.append({})
                    elif 'mfn' in name or 'mfns' in name or 'ids' in name:
                        args.append([1, 2, 3])
                    elif 'format' in name and p.kind == inspect.Parameter.POSITIONAL_ONLY or 'format' in name:
                        # some format params accept an int (mfn) or name; prefer 1
                        args.append(1)
                    else:
                        # fallback simple defaults
                        if p.default is not inspect._empty:
                            # has default, skip
                            continue
                        elif p.kind in (inspect.Parameter.VAR_POSITIONAL, inspect.Parameter.VAR_KEYWORD):
                            continue
                        else:
                            args.append(None)
                return args

            for name in probes:
                attr = getattr(client, name, None)
                try:
                    if callable(attr):
                        args = build_args_for(name, attr)
                        # remove None-only args to avoid surprising calls
                        safe_args = [a for a in args if a is not None]
                        try:
                            res = attr(*safe_args)
                        except TypeError:
                            # try calling without args as a last resort
                            res = attr()
                    else:
                        res = attr
                    m.write(f'-- {name}: {repr(res)}\n')
                except Exception as e:
                    m.write(f'-- {name}: ERROR: {e}\n')
    except Exception:
        # don't crash the exporter if probing fails
        pass


def safe_call(func, *args, **kwargs):
    try:
        return True, func(*args, **kwargs)
    except Exception as e:
        return False, str(e)


def extract_everything(client, out_dir, quiet=False):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    results = {}

    # 1) Databases
    if hasattr(client, 'list_databases'):
        ok, res = safe_call(client.list_databases)
        results['list_databases'] = res if ok else f'ERROR: {res}'
        dbs = res if ok else []
    else:
        results['list_databases'] = None
        dbs = []

    # try alternative get_databases
    if not dbs and hasattr(client, 'get_databases'):
        ok, res = safe_call(client.get_databases)
        results['get_databases'] = res if ok else f'ERROR: {res}'
        dbs = res if ok else dbs

    # write databases info
    with open(out_dir / 'databases.json', 'w', encoding='utf-8') as f:
        json.dump(results.get('list_databases') or results.get('get_databases') or dbs, f, ensure_ascii=False, indent=2)

    # if any databases, try get_database_info for each
    db_info = {}
    for db in (dbs or []):
        if hasattr(client, 'get_database_info'):
            ok, res = safe_call(client.get_database_info, db)
            db_info[db] = res if ok else f'ERROR: {res}'
    if db_info:
        with open(out_dir / 'databases_info.json', 'w', encoding='utf-8') as f:
            json.dump(db_info, f, ensure_ascii=False, indent=2)

    # 2) Files available on server
    files_out = out_dir / 'files'
    files_out.mkdir(exist_ok=True)
    files_list = None
    if hasattr(client, 'list_files'):
        ok, res = safe_call(client.list_files)
        files_list = res if ok else None
        with open(out_dir / 'files_list.json', 'w', encoding='utf-8') as f:
            json.dump(res if ok else {'error': res}, f, ensure_ascii=False, indent=2)

    # try to download a few files if accessible
    if files_list:
        for item in files_list:
            name = item if isinstance(item, str) else str(item)
            # try binary then text
            if hasattr(client, 'read_binary_file'):
                ok, data = safe_call(client.read_binary_file, name)
                if ok and data:
                    try:
                        with open(files_out / name, 'wb') as fh:
                            fh.write(data)
                        if not quiet:
                            print(f'Downloaded file {name}')
                        continue
                    except Exception:
                        pass
            if hasattr(client, 'read_text_file'):
                ok, data = safe_call(client.read_text_file, name)
                if ok and data is not None:
                    with open(files_out / (name + '.txt'), 'w', encoding='utf-8') as fh:
                        fh.write(str(data))
                    if not quiet:
                        print(f'Downloaded text file {name}')

    # 3) Server-level info
    meta = {}
    for probe in ('get_server_version', 'server_version', 'get_server_stat'):
        if hasattr(client, probe):
            ok, res = safe_call(getattr(client, probe))
            meta[probe] = res if ok else f'ERROR: {res}'
    with open(out_dir / 'server_meta.json', 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    # 4) Records: use get_max_mfn if available
    max_mfn = None
    if hasattr(client, 'get_max_mfn'):
        ok, res = safe_call(client.get_max_mfn)
        if ok and isinstance(res, int):
            max_mfn = res
    if max_mfn is None:
        max_mfn = getattr(client, 'max_mfn', None)

    records_out = out_dir / 'records'
    records_out.mkdir(exist_ok=True)

    # try to read raw records if available, otherwise read parsed
    for mfn in range(1, (max_mfn or 0) + 1):
        if hasattr(client, 'read_raw_record'):
            ok, raw = safe_call(client.read_raw_record, mfn)
            if ok and raw:
                # raw may be bytes or str
                path = records_out / f'{mfn}.raw'
                try:
                    if isinstance(raw, (bytes, bytearray)):
                        with open(path, 'wb') as fh:
                            fh.write(raw)
                    else:
                        with open(path, 'w', encoding='utf-8') as fh:
                            fh.write(str(raw))
                except Exception:
                    pass

        # parsed record
        if hasattr(client, 'read_record'):
            ok, rec = safe_call(client.read_record, mfn)
            if ok and rec:
                text = record_to_text(rec)
                try:
                    with open(records_out / f'{mfn}.txt', 'w', encoding='utf-8') as fh:
                        fh.write(text)
                except Exception:
                    pass

        # postings
        if hasattr(client, 'read_record_postings'):
            ok, post = safe_call(client.read_record_postings, mfn)
            if ok and post:
                try:
                    with open(records_out / f'{mfn}.postings.json', 'w', encoding='utf-8') as fh:
                        json.dump(post, fh, ensure_ascii=False, indent=2)
                except Exception:
                    pass

    # 5) Other useful lists: formats, processes, users
    extras = {}
    for name in ('list_formats', 'list_processes', 'list_users'):
        if hasattr(client, name):
            ok, res = safe_call(getattr(client, name))
            extras[name] = res if ok else f'ERROR: {res}'
    with open(out_dir / 'extras.json', 'w', encoding='utf-8') as f:
        json.dump(extras, f, ensure_ascii=False, indent=2)

    if not quiet:
        print(f'Extraction complete, outputs under {out_dir}')

    return out_dir


def main():
    parser = argparse.ArgumentParser(description='Export IRBIS records as readable text')
    parser.add_argument('--conn', '-c',
                        default='host=212.23.72.121;port=6666;database=RDR;user=1;password=1;',
                        help='IRBIS connection string')
    parser.add_argument('--out', '-o', default='irbis_records.txt', help='Output file')
    parser.add_argument('--max-fail', type=int, default=50, help='Stop after this many consecutive missing MFNs')
    parser.add_argument('--quiet', action='store_true', help='Reduce stdout progress')
    args = parser.parse_args()

    client = irbis.Connection()
    client.parse_connection_string(args.conn)
    client.connect()

    # write a small metadata file showing what the client/server exposes
    try:
        dump_server_capabilities(client, args.out + '.meta.txt')
        if not args.quiet:
            print(f'Wrote server/client probe to {args.out}.meta.txt')
    except Exception:
        pass

    mfns = None
    # Strategy 1: try a search that returns MFNs
    try:
        # common IRBIS search expression for all records
        mfns = client.search('@attr 1=1')
    except Exception:
        mfns = None

    out_path = args.out
    written = 0

    if mfns:
        # mfns may be list of ints or a space-separated string
        if isinstance(mfns, str):
            parts = mfns.strip().split()
            try:
                mfns = [int(x) for x in parts if x.isdigit()]
            except Exception:
                # leave as-is
                pass

        with open(out_path, 'w', encoding='utf-8') as f:
            for mfn in mfns:
                try:
                    rec = client.read_record(int(mfn))
                    text = record_to_text(rec)
                    f.write(f'=== MFN {mfn} ===\n')
                    f.write(text + '\n\n')
                    written += 1
                    if not args.quiet:
                        print(f'Wrote MFN {mfn}')
                except Exception as e:
                    if not args.quiet:
                        print(f'Failed MFN {mfn}: {e}', file=sys.stderr)

    else:
        # Strategy 2: try to get a max MFN, else scan until many consecutive failures
        max_mfn = None
        try:
            if hasattr(client, 'get_max_mfn'):
                max_mfn = client.get_max_mfn()
        except Exception:
            max_mfn = None

        if max_mfn is None:
            max_mfn = getattr(client, 'max_mfn', None)

        consecutive_failures = 0
        mfn = 1
        with open(out_path, 'w', encoding='utf-8') as f:
            while True:
                if max_mfn and mfn > max_mfn:
                    break
                try:
                    rec = client.read_record(mfn)
                    if rec:
                        text = record_to_text(rec)
                        f.write(f'=== MFN {mfn} ===\n')
                        f.write(text + '\n\n')
                        written += 1
                        consecutive_failures = 0
                        if not args.quiet:
                            print(f'Wrote MFN {mfn}')
                    else:
                        consecutive_failures += 1
                except Exception:
                    consecutive_failures += 1

                mfn += 1
                if consecutive_failures >= args.max_fail:
                    if not args.quiet:
                        print(f'Stopping after {consecutive_failures} consecutive missing MFNs (last tried {mfn-1})')
                    break

    try:
        client.disconnect()
    except Exception:
        pass

    print(f'Export finished, wrote {written} records to {out_path}')


if __name__ == '__main__':
    main()