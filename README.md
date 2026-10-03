# CineVerse Cinema Reservation System

**Business:** CineVerse Cinemas  
**Tagline:** *Your Seat. Your Story.*  
**Type:** Educational online movie reservation and cinema management system

## Business Description
CineVerse Cinemas is a realistic fictional cinema business. Customers use the public website to browse movies and showtimes, create an account, choose seats, add snacks, complete a simulated payment, and view a digital ticket. Administrators manage movies, showtimes, reservations, customers, and simulated transactions.

## Problem Being Solved
Cinema customers often need to ask manually about currently showing movies, schedules, ticket prices, and available seats. CineVerse centralizes that information and lets customers make reservations online. Administrators get one place to maintain movie listings and schedules and review reservations.

## Core Grading Requirements
- **Landing page:** public business introduction, hero carousel, images, services, movie listings, CTAs, mobile navigation.
- **Users:** Firebase Authentication registration/login/logout, user profiles, admin/customer roles, protected pages.
- **CRUD:** complete Create, Read, Update, Delete for the `movies` collection from the admin interface.
- **Persistent database:** Cloud Firestore.
- **Responsive:** designed for phones, tablets, laptops, and desktops.

## Tech Stack
- HTML5
- CSS3
- Vanilla JavaScript using ES modules
- Firebase JavaScript SDK 12.19.0 (modular API)
- Firebase Authentication
- Cloud Firestore
- GitHub / GitHub Pages

## Project Structure
```text
cineverse/
├── index.html, movies.html, movie-details.html, showtimes.html
├── booking.html, payment.html, ticket.html, my-tickets.html
├── login.html, register.html, profile.html
├── admin/
│   ├── dashboard.html, movies.html, showtimes.html
│   ├── reservations.html, users.html, transactions.html
│   ├── reports.html, settings.html
├── css/
├── js/
│   └── admin/
├── assets/
├── firestore.rules
├── firestore.indexes.json
└── README.md
```

## Firebase Setup
1. Go to the Firebase Console and create a project.
2. Add a **Web App** to the project.
3. Open **Authentication → Sign-in method** and enable **Email/Password**.
4. Open **Firestore Database** and create a database.
5. Copy the Firebase Web App configuration into `js/firebase-config.js`, replacing every `YOUR_...` value.
6. In **Firestore → Rules**, replace the rules with the contents of `firestore.rules`, then publish them.
7. If Firestore asks for indexes while loading showtimes, deploy the indexes in `firestore.indexes.json` or use the Firebase Console link shown in the error.

> Firebase Web configuration values are client configuration, not Admin SDK secrets. Database access is protected by Firebase Authentication and Firestore Security Rules. **Never** commit a Firebase Admin service-account JSON or private server credentials.

## Creating the Demonstration Admin
1. Register a normal account through `register.html` or create one in Firebase Authentication.
2. Find that user's UID in **Authentication → Users**.
3. Open Firestore and locate `users/{UID}`.
4. Change the `role` field from `user` to `admin` manually in the Firebase Console.
5. Sign out and sign back in. The Admin link and admin pages will now be available.

The public registration form never allows choosing `admin`.

## Password Security
User passwords are handled by Firebase Authentication and are **never stored in Firestore, LocalStorage, sessionStorage, or the application source code**. The application cannot read a user's password after registration.

## Adding the First Movies
The public pages contain fictional demo movie visuals so the layout can be previewed before Firebase is populated. For the required persistent CRUD demonstration:
1. Log in with the admin account.
2. Open `admin/movies.html`.
3. Create movie records in Firestore using the form.
4. Use paths such as `assets/posters/neon-horizon.svg` and `assets/banners/neon-horizon.svg`, or use your own permitted image URLs.
5. The public movie pages will read Firestore records once they exist.

## Adding Showtimes
Open `admin/showtimes.html`, select a movie, then choose the location, room, date, time, ticket price, and status. Booking pages query active showtimes from Firestore instead of hard-coding schedules.

## Booking and Double-Booking Protection
Booking requires authentication. When a user confirms payment, the app uses a Firestore transaction and deterministic `seatLocks/{showtimeId}_{seat}` documents. If another completed transaction has already locked a seat, the new transaction fails instead of creating a duplicate booking.

This is appropriate for an educational frontend-only project. A production cinema platform would usually add trusted server-side reservation expiry, payment verification, and seat-lock cleanup.

## Simulated Payments
GCash, Maya, card, and cash-at-cinema are **demonstrations only**. No banking request is made and no real card information should be entered. The app only stores a simulated transaction record in Firestore.

## Running Locally
Because the project uses JavaScript ES modules, do not open the HTML files using only `file://` URLs. Run a simple local web server from the project folder.

Python example:
```bash
python -m http.server 5500
```
Then open:
```text
http://localhost:5500
```

VS Code Live Server also works.

## GitHub Pages Deployment
1. Push the project to a GitHub repository.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the `main` branch and `/ (root)`.
5. Save and open the generated public URL.
6. In Firebase Authentication settings, add the deployed GitHub Pages hostname to the allowed/authorized domains if required by the current Firebase Console flow.

All project links are relative so repository-subdirectory deployment works.

## Test Accounts
Create instructor-approved demonstration accounts in Firebase Authentication. Example labels only:
- Admin email: `admin@cineverse.com`
- Customer email: `customer@example.com`

Do **not** commit real or personal passwords to GitHub. Give demonstration passwords to the instructor separately if required.

## Suggested Git Commit History
```text
Initial project setup
Add responsive CineVerse landing page
Add Firebase authentication
Add user profiles and role guards
Add Firestore security rules
Add complete movie CRUD
Add showtime management
Add seat reservation flow
Add simulated payment and digital ticket
Complete admin dashboard and documentation
```

## AI Tools Used
ChatGPT was used for project planning, UI suggestions, code-generation assistance, debugging guidance, Firebase integration guidance, and README preparation.

**Student disclosure:** All AI-generated code should be reviewed, tested, modified where necessary, and understood by the student before submission or defense.

## Limitations
- Payment is simulated; no real GCash, Maya, or card transaction occurs.
- The project is educational and is not a production ticketing service.
- The included movie names and SVG artwork are fictional demonstration content.
- Seat locks do not automatically expire. An administrator can remove test seat-lock documents when resetting demo data.
- Email change and production-grade payment verification are outside the project scope.

## Final Demonstration Checklist
- Register a customer and verify the `users/{uid}` profile is created.
- Log in and log out.
- Verify a normal customer cannot open `/admin/` pages.
- As admin: create, read, update, and delete a movie; refresh to prove Firestore persistence.
- Add an active showtime.
- As customer: select a showtime and seats, confirm a simulated payment, and open the digital ticket.
- Try booking the same seat again and confirm it appears occupied / cannot be booked.
- Verify **My Tickets** only shows the current user's reservations.
- Test at widths around 320, 375, 390, 430, 768 px and desktop.
- Deploy to GitHub Pages and test Firebase Authentication on the public URL.
