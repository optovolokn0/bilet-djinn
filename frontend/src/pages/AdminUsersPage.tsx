import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Добавлен импорт
import { adminApi } from '../api/admin'; // Проверьте путь импорта
import { type IUser } from '../modules'; // Проверьте путь импорта

export default function AdminUsersPage() {
  // 2. Инициализация хука навигации
  const navigate = useNavigate(); 

  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<'none' | 'librarian' | 'reader'>('none');

  // --- Данные форм ---
  const [libForm, setLibForm] = useState({
    username: '', email: '', first_name: '', last_name: '', 
    phone: '', birth_date: '', password: '', role: 'library'
  });

  const [readerForm, setReaderForm] = useState({
    ticket_number: '', contract_number: '', first_name: '', last_name: '',
    phone: '', birth_date: '', role: 'reader'
  });

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  // --- 3. Функция выхода ---
  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_role');
        navigate('/login'); // Или '/admin/login', в зависимости от ваших роутов
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllUsers();
      setUsers(data);
    } catch (error) {
      alert('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить пользователя?')) return;
    try {
      await adminApi.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
    } catch (error) {
      alert('Ошибка удаления');
    }
  };

  const handleCreateLibrarian = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createLibrarian(libForm);
      setSuccessMsg('Библиотекарь успешно создан');
      setActiveModal('none');
      loadUsers();
      // Очистка формы (опционально)
      setLibForm({ ...libForm, username: '', email: '', password: '' });
    } catch (error) {
      alert('Ошибка создания библиотекаря');
    }
  };

  const handleCreateReader = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminApi.createReader(readerForm);
      setSuccessMsg(`Читатель создан! ID: ${res.id}. ПАРОЛЬ: ${res.password} (Сохраните его!)`);
      setActiveModal('none');
      loadUsers();
      // Очистка формы (опционально)
      setReaderForm({ ...readerForm, ticket_number: '', contract_number: '' });
    } catch (error) {
      alert('Ошибка создания читателя');
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Управление пользователями</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setActiveModal('librarian')} style={btnStyle}>+ Библиотекарь</button>
          <button onClick={() => setActiveModal('reader')} style={btnStyle}>+ Читатель</button>
          
          {/* 4. Кнопка выхода */}
          <button onClick={handleLogout} style={logoutBtnStyle}>Выйти</button>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: '#d4edda', color: '#155724', padding: '10px', margin: '10px 0', borderRadius: '5px' }}>
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} style={{ marginLeft: '10px', cursor: 'pointer', background: 'none', border: 'none' }}>x</button>
        </div>
      )}

      <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th>ID</th>
            <th>Username / Ticket</th>
            <th>ФИО</th>
            <th>Роль</th>
            <th>Контакты</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username || u.ticket_number || '-'}</td>
              <td>{u.first_name} {u.last_name}</td>
              <td>
                <span style={{ 
                  padding: '2px 6px', borderRadius: '4px',
                  background: u.role === 'admin' ? '#ffcccc' : u.role === 'library' ? '#cce5ff' : '#e2e3e5'
                }}>
                  {u.role}
                </span>
              </td>
              <td>{u.email || u.phone}</td>
              <td>
                {u.role !== 'admin' && (
                  <button onClick={() => handleDelete(u.id)} style={{ color: 'red', cursor: 'pointer', background: 'none', border: 'none' }}>
                    Удалить
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Модальное окно Библиотекаря */}
      {activeModal === 'librarian' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3>Новый Библиотекарь</h3>
            <form onSubmit={handleCreateLibrarian} style={formStyle}>
              <input placeholder="Username" value={libForm.username} onChange={e => setLibForm({...libForm, username: e.target.value})} required />
              <input placeholder="Email" type="email" value={libForm.email} onChange={e => setLibForm({...libForm, email: e.target.value})} required />
              <input placeholder="Имя" value={libForm.first_name} onChange={e => setLibForm({...libForm, first_name: e.target.value})} required />
              <input placeholder="Фамилия" value={libForm.last_name} onChange={e => setLibForm({...libForm, last_name: e.target.value})} required />
              <input placeholder="Телефон" value={libForm.phone} onChange={e => setLibForm({...libForm, phone: e.target.value})} required />
              <input placeholder="Дата рожд. (YYYY-MM-DD)" type="date" value={libForm.birth_date} onChange={e => setLibForm({...libForm, birth_date: e.target.value})} required />
              <input placeholder="Пароль" type="password" value={libForm.password} onChange={e => setLibForm({...libForm, password: e.target.value})} required />
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={btnStyle}>Создать</button>
                <button type="button" onClick={() => setActiveModal('none')} style={{...btnStyle, background: '#6c757d'}}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно Читателя */}
      {activeModal === 'reader' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3>Новый Читатель</h3>
            <p style={{fontSize: '0.8em', color: '#666'}}>Пароль будет сгенерирован автоматически</p>
            <form onSubmit={handleCreateReader} style={formStyle}>
              <input placeholder="Номер билета" value={readerForm.ticket_number} onChange={e => setReaderForm({...readerForm, ticket_number: e.target.value})} required />
              <input placeholder="Номер договора" value={readerForm.contract_number} onChange={e => setReaderForm({...readerForm, contract_number: e.target.value})} required />
              <input placeholder="Имя" value={readerForm.first_name} onChange={e => setReaderForm({...readerForm, first_name: e.target.value})} required />
              <input placeholder="Фамилия" value={readerForm.last_name} onChange={e => setReaderForm({...readerForm, last_name: e.target.value})} required />
              <input placeholder="Телефон" value={readerForm.phone} onChange={e => setReaderForm({...readerForm, phone: e.target.value})} required />
              <input placeholder="Дата рожд. (YYYY-MM-DD)" type="date" value={readerForm.birth_date} onChange={e => setReaderForm({...readerForm, birth_date: e.target.value})} required />
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={btnStyle}>Создать</button>
                <button type="button" onClick={() => setActiveModal('none')} style={{...btnStyle, background: '#6c757d'}}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Стили
const btnStyle = { padding: '8px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };

// 5. Стиль для кнопки выхода (Красный)
const logoutBtnStyle = { ...btnStyle, background: '#dc3545', marginLeft: '10px' };

const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalStyle: React.CSSProperties = { background: 'white', padding: '20px', borderRadius: '8px', width: '400px' };
const formStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '10px' };