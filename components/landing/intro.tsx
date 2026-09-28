/**
 * Заставка «Welcome to HorecaPass» поверх первого экрана.
 *
 * Анимация целиком в CSS (globals.css, .intro-splash): заставка рисуется
 * сервером и уходит сама, JavaScript для этого не нужен. Скрипт ниже только
 * помечает, что в этой вкладке её уже видели: при возврате на главную
 * по «Назад» ждать две секунды второй раз незачем.
 *
 * Скрипт стоит перед разметкой заставки и выполняется при разборе HTML,
 * до первой отрисовки, — поэтому повторно она не мелькает даже на кадр.
 */
const MARK_SEEN = `try{if(sessionStorage.getItem('hp_intro'))document.documentElement.classList.add('intro-seen');else sessionStorage.setItem('hp_intro','1')}catch(e){}`;

export function IntroSplash() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: MARK_SEEN }} />
      <div
        aria-hidden
        className="intro-splash fixed inset-0 z-50 grid place-items-center bg-gradient-to-b from-peach-from to-peach-to"
      >
        <p className="intro-title text-center text-5xl font-bold leading-tight tracking-tight text-heading sm:text-6xl">
          <span className="intro-glow">Welcome</span> to
          <br />
          <span className="text-accent-strong dark:text-accent">HorecaPass</span>
        </p>
      </div>
    </>
  );
}
