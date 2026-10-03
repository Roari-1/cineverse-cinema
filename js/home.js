import { db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import { demoMovies } from "./demo-data.js";

import {
  money,
  qs,
  initNav
} from "./utils.js";


initNav();


let featured = [];

let i = 0;

let timer;


/* =========================================================
   MOVIE CARD
   ========================================================= */

function card(movie) {

  return `
    <article class="movie-card">

      <img
        src="${movie.posterUrl}"
        alt="${movie.title} poster"
      >

      <div class="movie-card-body">

        <h3>
          ${movie.title}
        </h3>

        <div class="meta">

          ${(movie.genres || []).join(", ")}

          •

          ${movie.runtime} min

        </div>

        <div class="price">

          ${money(movie.ticketPrice)}

        </div>

        <div class="card-actions">

          <a
            class="btn btn-secondary"
            href="movie-details.html?id=${movie.id}"
          >
            Details
          </a>

          <a
            class="btn btn-primary"
            href="booking.html?movie=${movie.id}"
          >
            Book
          </a>

        </div>

      </div>

    </article>
  `;
}


/* =========================================================
   SHOW FEATURED MOVIE
   ========================================================= */

function showHero() {

  const movie =
    featured[i];


  if (!movie) {
    return;
  }


  const hero =
    qs("#hero");


  hero.style.setProperty(
    "--hero",
    `url('${movie.backdropUrl}')`
  );


  qs(
    "#heroTitle"
  ).textContent =
    movie.title;


  qs(
    "#heroMeta"
  ).textContent =
    `${(movie.genres || []).join(" • ")} · ` +
    `${movie.runtime} min · ` +
    `${movie.ageRating}`;


  qs(
    "#heroSynopsis"
  ).textContent =
    movie.synopsis;


  qs(
    "#heroBook"
  ).href =
    `booking.html?movie=${movie.id}`;


  qs(
    "#heroDetails"
  ).href =
    `movie-details.html?id=${movie.id}`;


  qs(
    "#heroDots"
  ).innerHTML =
    featured
      .map(
        (_, index) => `
          <button
            class="hero-dot ${
              index === i
                ? "active"
                : ""
            }"
            data-i="${index}"
            aria-label="Show featured movie ${index + 1}"
          >
          </button>
        `
      )
      .join("");
}


/* =========================================================
   START AUTO ROTATION
   ========================================================= */

function start() {

  clearInterval(
    timer
  );


  /*
    No need to rotate if there
    is only one featured movie.
  */

  if (
    featured.length <= 1
  ) {
    return;
  }


  timer =
    setInterval(
      () => {

        i =
          (
            i + 1
          ) %
          featured.length;


        showHero();

      },
      6000
    );
}


/* =========================================================
   HERO DOTS
   ========================================================= */

qs(
  "#heroDots"
)?.addEventListener(
  "click",
  (event) => {

    if (
      event.target.dataset.i != null
    ) {

      i =
        Number(
          event.target.dataset.i
        );


      showHero();

      start();

    }

  }
);


/* =========================================================
   NEXT MOVIE
   ========================================================= */

qs(
  "#heroNext"
)?.addEventListener(
  "click",
  () => {

    if (
      !featured.length
    ) {
      return;
    }


    i =
      (
        i + 1
      ) %
      featured.length;


    showHero();

    start();

  }
);


/* =========================================================
   PREVIOUS MOVIE
   ========================================================= */

qs(
  "#heroPrev"
)?.addEventListener(
  "click",
  () => {

    if (
      !featured.length
    ) {
      return;
    }


    i =
      (
        i -
        1 +
        featured.length
      ) %
      featured.length;


    showHero();

    start();

  }
);


/* =========================================================
   REMOVE DUPLICATE MOVIES

   If a Firebase movie and demo movie
   have the same title, Firebase wins.
   ========================================================= */

function removeDuplicateMovies(
  firebaseMovies,
  demoMovieList
) {

  const firebaseTitles =
    new Set(
      firebaseMovies.map(
        (movie) =>
          movie.title
            .trim()
            .toLowerCase()
      )
    );


  const filteredDemoMovies =
    demoMovieList.filter(
      (movie) =>
        !firebaseTitles.has(
          movie.title
            .trim()
            .toLowerCase()
        )
    );


  return [
    ...firebaseMovies,
    ...filteredDemoMovies
  ];
}


/* =========================================================
   LOAD MOVIES
   ========================================================= */

async function load() {

  let firebaseMovies = [];


  try {

    const snapshot =
      await getDocs(
        query(

          collection(
            db,
            "movies"
          ),

          where(
            "status",
            "==",
            "now-showing"
          )

        )
      );


    firebaseMovies =
      snapshot.docs.map(
        (document) => ({

          id:
            document.id,

          ...document.data()

        })
      );


  } catch (error) {

    console.error(
      "Unable to load Firebase movies:",
      error
    );

  }


  /*
    Get the built-in demo movies
    that are currently showing.
  */

  const demoNowShowing =
    demoMovies.filter(
      (movie) =>
        movie.status ===
        "now-showing"
    );


  /*
    Combine Firebase movies
    with the original demo movies.

    Firebase movies appear first.
  */

  const all =
    removeDuplicateMovies(
      firebaseMovies,
      demoNowShowing
    );


  /*
    Featured carousel.

    Avengers + previous demo
    featured movies can now appear
    together.

    Maximum: 5 movies.
  */

  featured =
    all
      .filter(
        (movie) =>
          movie.featured
      )
      .slice(
        0,
        5
      );


  /*
    If no movie is explicitly
    featured, use the first movies.
  */

  if (
    !featured.length
  ) {

    featured =
      all.slice(
        0,
        5
      );

  }


  /*
    Reset carousel to first movie.
  */

  i = 0;


  showHero();

  start();


  /*
    Display homepage movie cards.
  */

  qs(
    "#homeMovies"
  ).innerHTML =
    all
      .slice(
        0,
        4
      )
      .map(
        card
      )
      .join("");

}


load();