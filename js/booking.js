import { db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import { requireAuth } from "./auth-guard.js";
import { demoMovies } from "./demo-data.js";

import {
  money,
  qs,
  pageParam,
  toast,
  initNav
} from "./utils.js";


initNav();


/* =========================================================
   VARIABLES
   ========================================================= */

let user;

let movie;

let showtimes = [];

let selectedShowtime = null;

let selectedSeats = new Set();


/* =========================================================
   SNACK DATA
   ========================================================= */

const snacks = {

  popcornS: {
    name: "Small Popcorn",
    price: 120
  },

  popcornL: {
    name: "Large Popcorn",
    price: 180
  },

  drink: {
    name: "Soft Drink",
    price: 100
  },

  nachos: {
    name: "Nachos",
    price: 150
  },

  hotdog: {
    name: "Hotdog",
    price: 140
  },

  combo: {
    name: "Combo Meal",
    price: 250
  }

};


let snackQty = {};


/* =========================================================
   FORMAT SHOWTIME
   Converts:
   13:00
   into:
   1:00 PM
   ========================================================= */

function formatBookingTime(time) {

  if (!time) {
    return "";
  }


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


/* =========================================================
   FORMAT DATE
   Converts:
   2026-12-18
   into:
   Dec 18, 2026
   ========================================================= */

function formatBookingDate(dateString) {

  if (!dateString) {
    return "";
  }


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


/* =========================================================
   CALCULATE BOOKING TOTAL
   ========================================================= */

function calc() {

  const ticketPrice =
    selectedShowtime?.ticketPrice ||
    movie?.ticketPrice ||
    0;


  const ticket =
    ticketPrice *
    selectedSeats.size;


  const food =
    Object.entries(
      snackQty
    ).reduce(
      (
        total,
        [key, quantity]
      ) => {

        return (
          total +
          (snacks[key]?.price || 0) *
          quantity
        );

      },
      0
    );


  /*
    Convenience fee is added
    when at least one seat
    is selected.
  */

  const fee =
    selectedSeats.size
      ? 40
      : 0;


  const total =
    ticket +
    food +
    fee;


  qs("#selectedSeats").textContent =
    [...selectedSeats].join(", ") ||
    "None";


  qs("#ticketQty").textContent =
    selectedSeats.size;


  qs("#ticketSubtotal").textContent =
    money(ticket);


  qs("#snackSubtotal").textContent =
    money(food);


  qs("#fee").textContent =
    money(fee);


  qs("#total").textContent =
    money(total);


  return {

    ticket,

    food,

    fee,

    total

  };
}


/* =========================================================
   GET MOVIE
   Reads movie from Firestore.

   If Firestore cannot find it,
   the demo movie is used instead.
   ========================================================= */

async function getMovie() {

  const id =
    pageParam("movie");


  /*
    If the booking page was opened
    without a movie parameter,
    use the first demo movie.
  */

  if (!id) {

    return demoMovies[0];

  }


  try {

    const snapshot =
      await getDoc(
        doc(
          db,
          "movies",
          id
        )
      );


    if (
      snapshot.exists()
    ) {

      return {

        id:
          snapshot.id,

        ...snapshot.data()

      };

    }

  } catch (error) {

    console.error(
      "Unable to load movie from Firestore:",
      error
    );

  }


  /*
    Fallback for demonstration
    movie records.
  */

  return (
    demoMovies.find(
      (item) =>
        item.id === id
    ) ||
    demoMovies[0]
  );
}


/* =========================================================
   LOAD SHOWTIMES

   Reads ACTIVE showtimes
   for the currently selected movie.

   This is connected to the
   admin Showtime Management page.
   ========================================================= */

async function loadShowtimes() {

  const select =
    qs("#showtime");


  /*
    Show loading state while
    Firebase is being queried.
  */

  select.innerHTML = `
    <option value="">
      Loading showtimes...
    </option>
  `;


  select.disabled = true;


  try {

    const snapshot =
      await getDocs(
        query(

          collection(
            db,
            "showtimes"
          ),

          where(
            "movieId",
            "==",
            movie.id
          ),

          where(
            "status",
            "==",
            "active"
          )

        )
      );


    showtimes =
      snapshot.docs.map(
        (document) => ({

          id:
            document.id,

          ...document.data()

        })
      );


    /*
      Sort showtimes by date
      and then by time.
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


  } catch (error) {

    console.error(
      "Unable to load movie showtimes:",
      error
    );


    showtimes = [];


    toast(
      "Unable to load showtimes. Please try again.",
      "error"
    );

  }


  /*
    No active showtimes
    were found.
  */

  if (
    !showtimes.length
  ) {

    select.innerHTML = `
      <option value="">
        No available showtimes
      </option>
    `;


    select.disabled = true;


    selectedShowtime = null;


    return;
  }


  /*
    Showtimes exist,
    so enable dropdown.
  */

  select.disabled = false;


  select.innerHTML = `
    <option value="">
      Select a showtime
    </option>
  `;


  /*
    Add each Firestore showtime
    into the dropdown.
  */

  showtimes.forEach(
    (showtime) => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        showtime.id;


      const date =
        formatBookingDate(
          showtime.date
        );


      const time =
        formatBookingTime(
          showtime.time
        );


      const location =
        showtime.cinemaLocation ||
        "CineVerse";


      const room =
        showtime.cinemaRoom ||
        "Cinema";


      const price =
        money(
          showtime.ticketPrice ||
          movie.ticketPrice ||
          0
        );


      option.textContent =
        `${date} · ` +
        `${time} · ` +
        `${location} · ` +
        `${room} · ` +
        `${price}`;


      select.appendChild(
        option
      );

    }
  );
}


/* =========================================================
   GET OCCUPIED SEATS

   Reads seatLocks belonging
   to the selected showtime.

   Seats already reserved
   become unavailable.
   ========================================================= */

async function occupied() {

  if (
    !selectedShowtime
  ) {

    return new Set();

  }


  try {

    const snapshot =
      await getDocs(
        query(

          collection(
            db,
            "seatLocks"
          ),

          where(
            "showtimeId",
            "==",
            selectedShowtime.id
          )

        )
      );


    return new Set(
      snapshot.docs.map(
        (document) =>
          document.data().seat
      )
    );


  } catch (error) {

    console.error(
      "Unable to load occupied seats:",
      error
    );


    return new Set();

  }
}


/* =========================================================
   DRAW CINEMA SEATS
   ========================================================= */

async function drawSeats() {

  /*
    Clear previously selected seats
    whenever the showtime changes.
  */

  selectedSeats.clear();


  const occupiedSeats =
    await occupied();


  const box =
    qs("#seatGrid");


  box.innerHTML = "";


  /*
    Rows A-H
  */

  for (
    const row of
    "ABCDEFGH"
  ) {

    const rowContainer =
      document.createElement(
        "div"
      );


    rowContainer.className =
      "seat-row";


    /*
      10 seats per row.
    */

    for (
      let number = 1;
      number <= 10;
      number++
    ) {

      const seatId =
        `${row}${number}`;


      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      /*
        Rows G and H are
        premium seats.
      */

      const premium =
        row >= "G";


      const isOccupied =
        occupiedSeats.has(
          seatId
        );


      button.className =
        "seat" +
        (
          premium
            ? " premium"
            : ""
        ) +
        (
          isOccupied
            ? " occupied"
            : ""
        );


      button.textContent =
        seatId;


      button.disabled =
        isOccupied;


      /*
        Select / deselect seat.
      */

      button.onclick =
        () => {

          if (
            selectedSeats.has(
              seatId
            )
          ) {

            selectedSeats.delete(
              seatId
            );

            button.classList.remove(
              "selected"
            );

          } else {

            selectedSeats.add(
              seatId
            );

            button.classList.add(
              "selected"
            );

          }


          calc();

        };


      rowContainer.append(
        button
      );

    }


    box.append(
      rowContainer
    );

  }


  calc();
}


/* =========================================================
   DISPLAY SNACK OPTIONS
   ========================================================= */

function renderSnacks() {

  const snackContainer =
    qs("#snacks");


  snackContainer.innerHTML =
    Object.entries(
      snacks
    )
      .map(
        (
          [key, snack]
        ) => `

          <div class="summary-row">

            <span>

              ${snack.name}
              —
              ${money(snack.price)}

            </span>


            <span>

              <button
                type="button"
                class="btn btn-secondary"
                data-snack="${key}"
                data-delta="-1"
              >
                −
              </button>


              <b
                id="qty-${key}"
              >
                0
              </b>


              <button
                type="button"
                class="btn btn-secondary"
                data-snack="${key}"
                data-delta="1"
              >
                +
              </button>

            </span>

          </div>

        `
      )
      .join("");
}


/* =========================================================
   SNACK BUTTON EVENTS
   ========================================================= */

qs("#snacks")
  ?.addEventListener(
    "click",
    (event) => {

      const button =
        event.target.closest(
          "[data-snack]"
        );


      if (!button) {
        return;
      }


      const key =
        button.dataset.snack;


      const change =
        Number(
          button.dataset.delta
        );


      snackQty[key] =
        Math.max(
          0,
          (
            snackQty[key] ||
            0
          ) +
          change
        );


      qs(
        `#qty-${key}`
      ).textContent =
        snackQty[key];


      calc();

    }
  );


/* =========================================================
   SHOWTIME SELECTION EVENT
   ========================================================= */

qs("#showtime")
  ?.addEventListener(
    "change",
    async (event) => {

      selectedShowtime =
        showtimes.find(
          (showtime) =>
            showtime.id ===
            event.target.value
        ) ||
        null;


      await drawSeats();

    }
  );


/* =========================================================
   CONTINUE TO PAYMENT
   ========================================================= */

qs("#continuePayment")
  ?.addEventListener(
    "click",
    () => {

      /*
        Showtime is required.
      */

      if (
        !selectedShowtime
      ) {

        toast(
          "Please select a showtime.",
          "error"
        );

        return;
      }


      /*
        At least one seat
        must be selected.
      */

      if (
        !selectedSeats.size
      ) {

        toast(
          "Please select at least one seat.",
          "error"
        );

        return;
      }


      /*
        Save temporary booking data.

        Payment page will read this
        from sessionStorage.
      */

      const pendingBooking = {

        movie,

        showtime:
          selectedShowtime,

        seats:
          [...selectedSeats],

        snackQty,

        totals:
          calc()

      };


      sessionStorage.setItem(
        "cineversePending",
        JSON.stringify(
          pendingBooking
        )
      );


      location.href =
        "payment.html";

    }
  );


/* =========================================================
   INITIALIZE BOOKING PAGE
   ========================================================= */

async function initializeBooking() {

  /*
    Booking requires
    logged-in user.
  */

  user =
    await requireAuth();


  /*
    Load selected movie.
  */

  movie =
    await getMovie();


  /*
    Show movie information.
  */

  qs(
    "#bookingMovie"
  ).textContent =
    movie.title ||
    "Selected Movie";


  qs(
    "#bookingPoster"
  ).src =
    movie.posterUrl ||
    "assets/posters/neon-horizon.svg";


  qs(
    "#bookingPoster"
  ).alt =
    `${movie.title || "Movie"} poster`;


  /*
    Load snack controls.
  */

  renderSnacks();


  /*
    Read showtimes from
    Firestore.
  */

  await loadShowtimes();


  /*
    Seat area starts empty
    until a showtime is selected.
  */

  await drawSeats();

}


/* =========================================================
   START PAGE
   ========================================================= */

initializeBooking();