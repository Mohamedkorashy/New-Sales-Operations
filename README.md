# SUD | Capital Heights 1 - Real Estate Dashboard

This is a web-based dashboard application designed to view, filter, and sort real estate unit data from an uploaded Excel file. It provides a quick and interactive way to get an overview of property statuses, types, and other details.

![CH1 App Screenshot](https://raw.githubusercontent.com/username/repo/main/screenshot.png) 
*Note: You will need to take a screenshot of your app and replace the URL above.*

## ✨ Features

- **Secure Login:** Access to the dashboard is protected by a username and password.
- **User Management:** Admin users can add and delete other user accounts.
- **Persistent Users:** User accounts are saved in the browser's local storage.
- **Excel File Upload:** Simply drag and drop or browse for an `.xlsx` or `.xls` file.
- **Dynamic Dashboard:** The UI automatically updates upon file upload.
- **Summary Statistics:** View key metrics like total units, available units, sold units, and average area.
- **Powerful Filtering:** Filter units by Building Type, Ownership Status, and Finishing.
- **Flexible Sorting:** Sort units by Area or Floor in ascending or descending order.
- **Live Search:** Instantly find units by their `Unit Code`.
- **Responsive Design:** Fully functional on both desktop and mobile devices.
- **Modern UI:** A clean, red-themed interface for easy viewing.

## 🚀 Getting Started

Since this project is built entirely with client-side technologies and uses CDN links for dependencies, there is no build step required.

1.  Clone this repository to your local machine.
2.  Open the `index.html` file in a modern web browser (like Chrome, Firefox, or Edge).
3.  The first time you run the application, a default admin account is created. Use the following credentials to log in:
    - **Username:** `admin`
    - **Password:** `password`
4.  After logging in as `admin`, you can access the dashboard. You will also see a "Manage Users" button in the header.
5.  On the User Management page, you can create new users (who will have the `user` role) and delete existing users.

## 🛠️ Technology Stack

- **Frontend:** React (with hooks), TypeScript
- **Styling:** CSS3 with Custom Properties (Variables)
- **Data Storage:** Browser Local Storage for user data.
- **Libraries:**
    - **SheetJS (`xlsx`):** For parsing Excel files directly in the browser.
    - **Font Awesome:** For icons.
- **No Backend Required:** All processing, including authentication and user management, is done on the client-side.

## 📄 Excel File Format

For the application to work correctly, your uploaded Excel file must contain a sheet with a header row with the following columns:

- `Unit Code` (Text)
- `Building Type` (Text)
- `Floor` (Number)
- `Area (m²)` (Number)
- `Ownership Status` (Text: 'Available' or 'Sold')
- `Finishing` (Text: 'Finished', 'Semi-Finished', or 'Core')

The application includes basic validation to check for the presence of essential columns.

## 👥 Credits

Developed by **SUD**.
