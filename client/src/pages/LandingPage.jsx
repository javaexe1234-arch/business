import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Header from "../components/Header.jsx";
import LeadForm from "../components/LeadForm.jsx";
import QuizWidget from "../components/QuizWidget.jsx";
import Reveal from "../components/Reveal.jsx";

const advantages = [
  {
    mark: "01",
    title: "Сначала конструкция",
    text: "Не начинаем с картинок. Собираем каркас страниц, оффер и путь заявки, затем рисуем оболочку.",
  },
  {
    mark: "02",
    title: "Один продюсер",
    text: "Один человек ведёт смету, сроки и правки. Не теряетесь между дизайнером и разработчиком.",
  },
  {
    mark: "03",
    title: "Заявки, не витрина",
    text: "Формы, квиз и уведомления в Telegram входят в запуск. Сайт должен приносить контакты с первой недели.",
  },
  {
    mark: "04",
    title: "Сроки на бумаге",
    text: "Календарь работ фиксируем до предоплаты. Если сдвигаемся мы — говорим заранее, не после дедлайна.",
  },
];

const reviews = [
  {
    quote: "Лендинг собрали за 14 дней. Заявки пошли с контекста, форма не ломалась на телефоне.",
    name: "Ирина Коваль",
    role: "школа подготовки к ЕГЭ",
  },
  {
    quote: "Пересобрали каталог магазина. Фильтры стали понятнее, средний чек вырос без смены рекламы.",
    name: "Павел Немцев",
    role: "магазин света",
  },
  {
    quote: "Корпоративный сайт наконец совпал с тем, как мы продаём: кейсы, команда, форма на каждой услуге.",
    name: "Марина Дубова",
    role: "инженерное бюро",
  },
];

const faqs = [
  {
    q: "Сколько стоит сайт?",
    a: "Лендинг — от 90 000 ₽, сайт компании — от 180 000 ₽, магазин — от 280 000 ₽. Точная смета после короткого брифа: страницы, интеграции, тексты.",
  },
  {
    q: "Что нужно от нас на старте?",
    a: "Задача, примеры сайтов, которые нравятся, и доступы к домену, если он уже есть. Тексты и фото можем собрать вместе.",
  },
  {
    q: "Можно ли только дизайн без разработки?",
    a: "Да, но чаще берём проект целиком: так меньше разрывов между макетом и вёрсткой.",
  },
  {
    q: "Как работает ИИ-квиз?",
    a: "Помощник отвечает по услугам студии и задаёт 4 вопроса. В конце берёт имя и телефон — заявка падает в админку и в Telegram.",
  },
];

export default function LandingPage() {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const yA = useTransform(scrollY, [0, 700], [0, reduced ? 0 : 140]);
  const yB = useTransform(scrollY, [0, 700], [0, reduced ? 0 : -90]);
  const yC = useTransform(scrollY, [0, 700], [0, reduced ? 0 : 60]);

  return (
    <>
      <Header />
      <main className="grid-bg">
        <section className="hero" id="offer">
          <motion.div className="parallax-layer layer-c" style={{ y: yC }}>
            01
          </motion.div>
          <motion.div className="parallax-layer layer-a" style={{ y: yA }} />
          <motion.div className="parallax-layer layer-b" style={{ y: yB }} />
          <div className="hero-copy">
            <h1>Сайт как чертёж: сначала несущие стены, потом фасад.</h1>
            <p>
              Студия «Чертёж» делает лендинги, корпоративные сайты и магазины. ИИ-квиз подбирает формат за пару минут
              и передаёт заявку продюсеру.
            </p>
            <div className="hero-actions">
              <a className="btn btn-solid" href="#lead">
                Рассчитать проект
              </a>
              <button className="btn" type="button" onClick={() => window.dispatchEvent(new Event("open-quiz"))}>
                Спросить ИИ
              </button>
            </div>
          </div>
        </section>

        <section className="section" id="advantages">
          <Reveal>
            <h2>Что держит проект</h2>
          </Reveal>
          <div className="spec-list">
            {advantages.map((item, index) => (
              <Reveal key={item.mark} delay={index * 0.06}>
                <article className="spec-item">
                  <span>{item.mark}</span>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="section" id="reviews">
          <Reveal>
            <h2>Что говорят после запуска</h2>
          </Reveal>
          <div className="reviews">
            {reviews.map((item, index) => (
              <Reveal key={item.name} delay={index * 0.08}>
                <blockquote className="review">
                  <p>{item.quote}</p>
                  <span>
                    {item.name}, {item.role}
                  </span>
                </blockquote>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="section faq" id="faq">
          <Reveal>
            <h2>Частые вопросы</h2>
          </Reveal>
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </section>

        <section className="section" id="lead">
          <Reveal>
            <h2>Оставить заявку продюсеру</h2>
            <LeadForm />
          </Reveal>
        </section>
      </main>
      <footer className="site-footer">
        <span>Студия «Чертёж», 2026</span>
        <a href="/admin">Админка</a>
      </footer>
      <QuizWidget />
    </>
  );
}
