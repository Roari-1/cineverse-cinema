import { db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import {
  qs,
  initNav,
  money
} from "./utils.js";

initNav();


/*
  Converts 24-hour time to readable AM/PM.
*/
function formatTime(time) {

  if (!time) return "";

  const [hourValue, minute] =
    time.split(":");

  let hour =
    Number(hourValue);

  const period =
    hour >= 12
      ? "PM"
      : "AM";

  hour =
    hour % 12 || 12;

  return `${hour}:${minute} ${period}`;
}


/*
  Makes dates easier to read.
*/
function formatDate(dateString) {

  if (!dateString) return "";

  const date =
    new Date(
      `${dateString}T00:00:00`
    );

  return date.toLocaleDateString(
    "en-PH",
    {
      year: "numeric",
      month: "short",
      day: "numeric"
    }
  );
}


/*
  Reads active showtimes from Firestore.
*/
async function loadShowtimes() {

  const container =
    qs("#showtimeList");

  container.innerHTML = `
    <div class="empty">
      Loading showtimes...
    </div>
  `;

  try {

    const snapshot =
      await getDocs(
        query(
          collection(
            db,
            "showtimes"
          ),

          where(
            "status",
            "==",
            "active"
          )
        )
      );


    let showtimes =
      snapshot.docs.map(
        (document) => ({
          id: document.id,
          ...document.data()
        })
      );


    /*
      Sort schedules by date and time.
    */
    showtimes.sort(
      (a, b) => {

        const first =
          `${a.date || ""} ${a.time || ""}`;

        const second =
          `${b.date || ""} ${b.time || ""}`;

        return first.localeCompare(
          second
        );
      }
    );


    if (!showtimes.length) {

      container.innerHTML = `
        <div class="empty">

          No active showtimes are
          currently available.

        </div>
      `;

      return;
    }


    container.innerHTML =
      showtimes
        .map(
          (showtime) => `

            <article class="panel">

              <div class="eyebrow">
                ${showtime.cinemaLocation}
              </div>

              <h2>
                ${showtime.movieTitle}
              </h2>

              <p class="muted">
                ${showtime.cinemaRoom}
              </p>


              <div class="meta">

                <span>
                  ${formatDate(
                    showtime.date
                  )}
                </span>

                <span>
                  ${formatTime(
                    showtime.time
                  )}
                </span>

                <span>
                  ${money(
                    showtime.ticketPrice
                  )}
                </span>

              </div>


              <div
                style="
                  margin-top: 18px;
                "
              >

                <a
                  class="btn btn-primary"
                  href="booking.html?movie=${encodeURIComponent(
                    showtime.movieId
                  )}"
                >
                  Book Tickets
                </a>

              </div>

            </article>

          `
        )
        .join("");

  } catch (error) {

    console.error(
      "Showtime loading error:",
      error
    );

    container.innerHTML = `
      <div class="empty">

        Unable to load showtimes.

        Please try again later.

      </div>
    `;
  }
}


loadShowtimes();