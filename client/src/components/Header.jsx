import { Link } from "react-router-dom";
import { useTheme } from "../theme.jsx";

export default function Header({ compact = false }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="site-header">
      <Link className="logo" to="/">
        Чертёж
      </Link>
      <nav className="nav">
        {!compact && (
          <>
            <a href="#advantages">Состав</a>
            <a href="#reviews">Кейсы клиентов</a>
            <a href="#faq">Вопросы</a>
            <a className="btn btn-solid" href="#lead">
              Оставить заявку
            </a>
          </>
        )}
        <button className="icon-btn" type="button" onClick={toggleTheme}>
          {theme === "dark" ? "Светлая" : "Тёмная"}
        </button>
        {compact && (
          <Link className="btn" to="/">
            На сайт
          </Link>
        )}
      </nav>
    </header>
  );
}
