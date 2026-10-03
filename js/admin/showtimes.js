import { db } from "../firebase-config.js";

import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import { adminInit } from "./common.js";
import { qs, toast, money } from "../utils.js";

let showtimes = [];
let movies = [];
let editingId = null;

/*
  Loads all movies and showtimes from Firestore.
*/
async function loadData() {
  try {
    const movieSnapshot = await getDocs(
      query(collection(db, "movies"), orderBy("title"))
    );

    movies = movieSnapshot.docs.map((document) => ({
      id: document.id,
      ...document.data()
    }));

    const showtimeSnapshot = await getDocs(
      collection(db, "showtimes")
    );

    showtimes = showtimeSnapshot.docs.map((document) => ({
      id: document.id,
      ...document.data()
    }));

    populateMovieDropdown();
    renderShowtimes();

  } catch (error) {
    console.error("Failed to load showtimes:", error);

    toast(
      "Unable to load showtimes. Check Firebase and Firestore rules.",
      "error"
    );
  }
}


/*
  Adds all Firestore movies to the Movie dropdown.
*/
function populateMovieDropdown() {
  const movieSelect = qs("#movieId");

  movieSelect.innerHTML =
    `<option value="">Select movie</option>` +
    movies
      .map(
        (movie) =>
          `<option value="${movie.id}">
            ${movie.title}
          </option>`
      )
      .join("");
}


/*
  Displays all showtimes inside the admin table.
*/
function renderShowtimes() {
  const tableBody = qs("#showRows");

  if (!showtimes.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8">
          No showtimes found. Add your first schedule.
        </td>
      </tr>
    `;

    return;
  }

  const sortedShowtimes = [...showtimes].sort((a, b) => {
    const first = `${a.date || ""} ${a.time || ""}`;
    const second = `${b.date || ""} ${b.time || ""}`;

    return first.localeCompare(second);
  });

  tableBody.innerHTML = sortedShowtimes
    .map(
      (showtime) => `
        <tr>

          <td>
            ${showtime.movieTitle || "Unknown Movie"}
          </td>

          <td>
            ${showtime.cinemaLocation || ""}
          </td>

          <td>
            ${showtime.cinemaRoom || ""}
          </td>

          <td>
            ${showtime.date || ""}
          </td>

          <td>
            ${formatTime(showtime.time)}
          </td>

          <td>
            ${money(showtime.ticketPrice || 0)}
          </td>

          <td>
            <span class="status-badge">
              ${showtime.status || "active"}
            </span>
          </td>

          <td>

            <button
              type="button"
              class="btn btn-secondary"
              data-edit="${showtime.id}"
            >
              Edit
            </button>

            <button
              type="button"
              class="btn btn-danger"
              data-delete="${showtime.id}"
            >
              Delete
            </button>

          </td>

        </tr>
      `
    )
    .join("");
}


/*
  Converts 24-hour time to readable AM/PM.
  Example:
  13:00 -> 1:00 PM
*/
function formatTime(time) {
  if (!time) return "";

  const [hourValue, minute] = time.split(":");

  let hour = Number(hourValue);

  const period = hour >= 12 ? "PM" : "AM";

  hour = hour % 12 || 12;

  return `${hour}:${minute} ${period}`;
}


/*
  Reads all values from the showtime form.
*/
function getFormData() {
  const movieId = qs("#movieId").value;

  const selectedMovie = movies.find(
    (movie) => movie.id === movieId
  );

  return {
    movieId: movieId,

    movieTitle: selectedMovie?.title || "",

    cinemaLocation: qs("#location").value,

    cinemaRoom: qs("#room").value,

    date: qs("#date").value,

    time: qs("#time").value,

    ticketPrice: Number(qs("#price").value),

    status: qs("#status").value
  };
}


/*
  Clears the form after adding/editing a showtime.
*/
function resetForm() {
  editingId = null;

  qs("#showForm").reset();

  const submitButton =
    qs("#showForm button[type='submit']");

  submitButton.textContent = "Save Showtime";
}


/*
  CREATE or UPDATE showtime.
*/
qs("#showForm")?.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const showtime = getFormData();

    if (!showtime.movieId) {
      toast(
        "Please select a movie.",
        "error"
      );

      return;
    }

    if (!showtime.date) {
      toast(
        "Please select a date.",
        "error"
      );

      return;
    }

    if (!showtime.time) {
      toast(
        "Please select a time.",
        "error"
      );

      return;
    }

    if (
      !showtime.ticketPrice ||
      showtime.ticketPrice <= 0
    ) {
      toast(
        "Ticket price must be greater than ₱0.",
        "error"
      );

      return;
    }

    try {

      /*
        UPDATE existing showtime
      */
      if (editingId) {

        await updateDoc(
          doc(db, "showtimes", editingId),
          {
            ...showtime,
            updatedAt: serverTimestamp()
          }
        );

        toast(
          "Showtime updated successfully."
        );

      }

      /*
        CREATE new showtime
      */
      else {

        await addDoc(
          collection(db, "showtimes"),
          {
            ...showtime,

            createdAt: serverTimestamp(),

            updatedAt: serverTimestamp()
          }
        );

        toast(
          "Showtime created successfully."
        );
      }

      resetForm();

      await loadData();

    } catch (error) {

      console.error(
        "Showtime save error:",
        error
      );

      toast(
        "Unable to save showtime.",
        "error"
      );
    }
  }
);


/*
  Handles Edit and Delete buttons.
*/
qs("#showRows")?.addEventListener(
  "click",
  async (event) => {

    const editId =
      event.target.dataset.edit;

    const deleteId =
      event.target.dataset.delete;


    /*
      EDIT SHOWTIME
    */
    if (editId) {

      const showtime =
        showtimes.find(
          (item) =>
            item.id === editId
        );

      if (!showtime) {
        return;
      }

      editingId = editId;

      qs("#movieId").value =
        showtime.movieId;

      qs("#location").value =
        showtime.cinemaLocation;

      qs("#room").value =
        showtime.cinemaRoom;

      qs("#date").value =
        showtime.date;

      qs("#time").value =
        showtime.time;

      qs("#price").value =
        showtime.ticketPrice;

      qs("#status").value =
        showtime.status;


      const submitButton =
        qs("#showForm button[type='submit']");

      submitButton.textContent =
        "Update Showtime";


      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      return;
    }


    /*
      DELETE SHOWTIME
    */
    if (deleteId) {

      const showtime =
        showtimes.find(
          (item) =>
            item.id === deleteId
        );

      if (!showtime) {
        return;
      }

      const confirmed =
        confirm(
          `Delete the showtime for "${showtime.movieTitle}"?

This action cannot be undone.`
        );

      if (!confirmed) {
        return;
      }

      try {

        await deleteDoc(
          doc(
            db,
            "showtimes",
            deleteId
          )
        );

        toast(
          "Showtime deleted successfully."
        );

        await loadData();

      } catch (error) {

        console.error(
          "Delete showtime error:",
          error
        );

        toast(
          "Unable to delete showtime.",
          "error"
        );
      }
    }
  }
);


/*
  Protect admin page first,
  then load Firestore data.
*/
await adminInit();

await loadData();