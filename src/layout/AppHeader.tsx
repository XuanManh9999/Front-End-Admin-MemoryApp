import { useEffect, useRef, useState } from "react";

import { Link } from "react-router";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);

  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (window.innerWidth >= 991) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200  dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex flex-col items-center justify-between flex-grow lg:flex-row lg:px-6">
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          <button
            className="items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg z-99999 dark:border-gray-800 lg:flex dark:text-gray-400 lg:h-11 lg:w-11 lg:border"
            onClick={handleToggle}
            aria-label="Toggle Sidebar">
            {isMobileOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg
                width="16"
                height="12"
                viewBox="0 0 16 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                  fill="currentColor"
                />
              </svg>
            )}
            {/* Cross Icon */}
          </button>

          <Link to="/" className="lg:hidden">
            {/* <img
              className="dark:hidden"
              src="./images/logo/logo.svg"
              alt="Logo"
            />


            <img
              className="hidden dark:block"
              src="./images/logo/logo-dark.svg"
              alt="Logo"
            /> */}

            <svg
              width="160"
              height="44"
              fill="#fff"
              style={{
                width: "100%",
                height: "100%",
                maxWidth: "160px",
              }}
              aria-labelledby="logo-:Rpjabm:"
              viewBox="0 0 712 105"
              xmlns="http://www.w3.org/2000/svg">
              <path d="M188.21 66.26C187.89 65.93 188.12 65.38 188.58 65.38H190.54C190.54 65.38 190.63 65.38 190.68 65.38C207.77 63.64 222.05 52.6 222.05 33.01C222.05 10.44 203.84 0.0100098 182.98 0.0100098H85.28C83.97 0.0100098 82.9 1.07001 82.9 2.39001V102.54C82.9 103.85 83.96 104.92 85.28 104.92H116.48C117.79 104.92 118.86 103.86 118.86 102.54V70.56C118.86 69.25 119.92 68.18 121.24 68.18H141.52C144.33 68.18 147.01 69.39 148.88 71.49L177.77 104.11C178.39 104.39 178.93 104.63 179.55 104.91H220.73C222.84 104.91 223.9 102.37 222.42 100.86L188.22 66.26H188.21ZM175.2 44.68H121.23C119.92 44.68 118.85 43.62 118.85 42.3V27.13C118.85 25.82 119.91 24.75 121.23 24.75H174.42C182.05 24.75 187.03 28.49 187.03 34.4C187.03 41.25 182.36 44.67 175.2 44.67V44.68Z"></path>
              <path d="M582.55 0.0100098H551.36C550.046 0.0100098 548.98 1.07557 548.98 2.39001V68.87C548.98 70.1844 550.046 71.25 551.36 71.25H582.55C583.864 71.25 584.93 70.1844 584.93 68.87V2.39001C584.93 1.07557 583.864 0.0100098 582.55 0.0100098Z"></path>
              <path d="M582.55 85.41H551.36C550.046 85.41 548.98 86.4756 548.98 87.79V102.54C548.98 103.854 550.046 104.92 551.36 104.92H582.55C583.864 104.92 584.93 103.854 584.93 102.54V87.79C584.93 86.4756 583.864 85.41 582.55 85.41Z"></path>
              <path d="M711.02 101.78L670.88 48.63C669.98 47.44 670.06 45.79 671.06 44.69L708.97 3.11001C710.05 1.92001 709.21 0.0100098 707.6 0.0100098H674.8C673.93 0.0100098 673.1 0.380012 672.52 1.02001L635.92 41.25H635.9C635.78 41.38 635.62 41.48 635.42 41.48H634.1C633.75 41.48 633.48 41.2 633.47 40.86V2.2C633.47 0.990005 632.49 0.0100098 631.28 0.0100098H601.29C600.08 0.0100098 599.1 0.990005 599.1 2.2V102.6C599.1 103.71 600 104.61 601.11 104.61H631.45C632.56 104.61 633.46 103.71 633.46 102.6V83.91C633.46 83.13 633.76 82.37 634.29 81.8L647.61 67.55C647.61 67.55 647.73 67.37 648 67.37H649.8C650.02 67.37 650.15 67.55 650.15 67.55L676.99 103.37C677.57 104.15 678.49 104.61 679.46 104.61H709.6C711.06 104.61 711.9 102.94 711.01 101.77L711.02 101.78Z"></path>
              <path d="M270.58 23.98H301.09C302.4 23.98 303.47 22.92 303.47 21.6V2.38C303.47 1.07 302.41 0 301.09 0H237.98C236.67 0 235.6 1.06 235.6 2.38V102.53C235.6 103.84 236.66 104.91 237.98 104.91H301.09C302.4 104.91 303.47 103.85 303.47 102.53V83.31C303.47 82 302.41 80.93 301.09 80.93H270.36C269.05 80.93 267.98 79.87 267.98 78.55V66.09C267.98 64.66 269.14 63.49 270.58 63.49H301.09C302.4 63.49 303.47 62.43 303.47 61.11V42.36C303.47 41.05 302.41 39.98 301.09 39.98H270.58C269.15 39.98 267.98 38.82 267.98 37.38V26.54C267.98 25.11 269.14 23.94 270.58 23.94V23.98Z"></path>
              <path d="M352.6 23.98H383.11C384.42 23.98 385.49 22.92 385.49 21.6V2.38C385.49 1.07 384.43 0 383.11 0H320C318.69 0 317.62 1.06 317.62 2.38V102.53C317.62 103.84 318.68 104.91 320 104.91H383.11C384.42 104.91 385.49 103.85 385.49 102.53V83.31C385.49 82 384.43 80.93 383.11 80.93H352.38C351.07 80.93 350 79.87 350 78.55V66.09C350 64.66 351.16 63.49 352.6 63.49H383.11C384.42 63.49 385.49 62.43 385.49 61.11V42.36C385.49 41.05 384.43 39.98 383.11 39.98H352.6C351.17 39.98 350 38.82 350 37.38V26.54C350 25.11 351.16 23.94 352.6 23.94V23.98Z"></path>
              <path d="M35.87 23.98H66.38C67.69 23.98 68.76 22.92 68.76 21.6V2.38C68.76 1.07 67.7 0 66.38 0H3.27001C1.96001 0 0.890015 1.06 0.890015 2.38V102.53C0.890015 103.84 1.95001 104.91 3.27001 104.91H30.88C32.19 104.91 33.26 103.85 33.26 102.53L33.28 66.1C33.28 64.67 34.44 63.5 35.88 63.5H66.39C67.7 63.5 68.77 62.44 68.77 61.12V42.37C68.77 41.06 67.71 39.99 66.39 39.99H35.88C34.45 39.99 33.28 38.83 33.28 37.39V26.55C33.28 25.12 34.44 23.95 35.88 23.95L35.87 23.98Z"></path>
              <path d="M496.49 0.0100098H402.03C400.72 0.0100098 399.65 1.07001 399.65 2.39001V102.54C399.65 103.85 400.71 104.92 402.03 104.92H433.23C434.54 104.92 435.61 103.86 435.61 102.54V69.39C435.61 68.72 436.15 68.18 436.82 68.18H496.65C520.63 68.18 538.8 55.68 538.8 33.61C538.8 11.54 520.63 0.0100098 496.5 0.0100098H496.49ZM491.95 44.68H437.98C436.67 44.68 435.6 43.62 435.6 42.3V27.13C435.6 25.82 436.66 24.76 437.98 24.76H491.17C498.8 24.76 503.78 28.49 503.78 34.41C503.78 41.26 499.11 44.68 491.95 44.68Z"></path>
            </svg>
          </Link>

          <button
            onClick={toggleApplicationMenu}
            className="flex items-center justify-center w-10 h-10 text-gray-700 rounded-lg z-99999 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z"
                fill="currentColor"
              />
            </svg>
          </button>

          {/* <div className="hidden lg:block">
            <form>
              <div className="relative">
                <span className="absolute -translate-y-1/2 pointer-events-none left-4 top-1/2">
                  <svg
                    className="fill-gray-500 dark:fill-gray-400"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                      fill=""
                    />
                  </svg>
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search or type command..."
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
                />

                <button className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                  <span> ⌘ </span>
                  <span> K </span>
                </button>
              </div>
            </form>
          </div> */}
        </div>
        <div
          className={`${
            isApplicationMenuOpen ? "flex" : "hidden"
          } items-center justify-between w-full gap-4 px-5 py-4 lg:flex shadow-theme-md lg:justify-end lg:px-0 lg:shadow-none`}>
          <div className="flex items-center gap-2 2xsm:gap-3">
            {/* <!-- Dark Mode Toggler --> */}
            <ThemeToggleButton />
            {/* <!-- Dark Mode Toggler --> */}
            {/* <NotificationDropdown /> */}
            {/* <!-- Notification Menu Area --> */}
          </div>
          {/* <!-- User Area --> */}
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
