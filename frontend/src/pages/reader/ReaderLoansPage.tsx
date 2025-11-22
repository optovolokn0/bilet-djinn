import { useEffect, useState } from "react";
import { useAppSelector } from "../../hooks";

interface ILoan {
  id: number;
  copy: {
    id: number;
    book_group: number;
    status: string;
  };
  reader: any;
  issued_at: string;
  due_at: string;
  status: string;
}

export default function ReaderLoansPage() {
  const token = useAppSelector((s) => s.auth.access);
  const [loans, setLoans] = useState<ILoan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          "https://truly-economic-vervet.cloudpub.ru/api/loans/active/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Ошибка загрузки");

        const data = await res.json();
        setLoans(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  if (loading) return <p>Загрузка...</p>;

  return (
    <div className="loans-page">
      <h2>Мои книги</h2>

      {loans.length === 0 && <p>У вас нет активных книг</p>}

      <div className="loans-list">
        {loans.map((loan) => (
          <LoanCard key={loan.id} loan={loan} />
        ))}
      </div>
    </div>
  );
}

function LoanCard({ loan }: { loan: ILoan }) {
  const due = new Date(loan.due_at).toLocaleDateString("ru-RU");

  return (
    <article className="loan-card">
      <div className="cover-wrapper">
        <img
          src="/cover.jpg"
          alt="cover"
          className="loan-cover"
        />
      </div>

      <div className="loan-info">
        <p><b>ID экземпляра:</b> {loan.copy.id}</p>
        <p><b>ID группы книги:</b> {loan.copy.book_group}</p>
        <p><b>Статус:</b> {loan.status}</p>
        <p><b>Вернуть до:</b> {due}</p>
      </div>
    </article>
  );
}
