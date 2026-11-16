import React from "react";
import ReactDOM from "react-dom/client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GymPublicBooking } from "./features/booking/GymPublicBooking";
import { GymApp } from "./features/gym/GymApp";
import { AppUpdateNotice } from "./shared/components/AppUpdateNotice";
import "./styles/global.css";

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}

// Link publico de turnos: #/anotarse/<token> entra directo, sin login.
const bookingMatch = window.location.hash.match(/^#\/anotarse\/([a-f0-9]{32})/);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {bookingMatch ? (
      <GymPublicBooking token={bookingMatch[1]} />
    ) : (
      <>
        <GymApp />
        <AppUpdateNotice />
      </>
    )}
    <ToastContainer
      position="bottom-right"
      autoClose={3200}
      hideProgressBar
      newestOnTop
      closeButton
      pauseOnFocusLoss={false}
      pauseOnHover
      draggable={false}
      theme="dark"
    />
  </React.StrictMode>
);
