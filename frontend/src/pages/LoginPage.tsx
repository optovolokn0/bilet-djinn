import { useState } from "react";
import { useAppDispatch } from "../hooks";
import { setCredentials } from "../features/auth/authSlice";
import type { IUser, UserRole } from "../modules";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      setError("");

      // 1. Логинимся
      const response = await fetch(
        "https://truly-economic-vervet.cloudpub.ru/api/auth/reader/login/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: login, password }),
        }
      );

      if (!response.ok) throw new Error("Неверный логин или пароль");

      const data = await response.json();
      const { access, refresh } = data;

      // 2. Получаем данные пользователя
      const userResp = await fetch(
        "https://truly-economic-vervet.cloudpub.ru/api/auth/me/",
        {
          headers: { Authorization: `Bearer ${access}` },
        }
      );

      if (!userResp.ok) throw new Error("Не удалось получить данные пользователя");

      const userData = await userResp.json();

      const mappedUser: IUser = {
        id: userData.id,
        role: userData.role as UserRole,
        username: userData.username ?? null,
        first_name: userData.first_name ?? null,
        last_name: userData.last_name ?? null,
        password: "",
        email: userData.email ?? null,
        phone: userData.phone ?? null,
        birth_date: userData.birth_date ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 3. Сохраняем в Redux
      dispatch(setCredentials({ access, refresh, user: mappedUser }));

      // 4. Перебрасываем на каталог по роли
      if (mappedUser.role === "reader") navigate("/reader/catalog");
      else if (mappedUser.role === "library") navigate("/library/catalog");

    } catch (err: any) {
      setError(err?.message || "Ошибка входа");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Авторизация</h2>
      <input
        type="text"
        placeholder="Логин / Email / Номер билета"
        value={login}
        onChange={(e) => setLogin(e.target.value)}
      />
      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Войти</button>
      {error && <div style={{ color: "red" }}>{error}</div>}
    </div>
  );
};

export default LoginPage;
