# Food Rescue Network – A Waste Food Management System

**Indian Institute of Information Technology, Surat (IIIT Surat)**  
**3rd Semester B.Tech – Database Management Systems (DBMS) Coursework Project**

---

## 1. Project Overview

**Food Rescue Network** is a full-stack DBMS application built to minimize food wastage by connecting surplus food donors (restaurants, hotels, events, individuals) with partner NGOs, logistics/fleet delivery partners, and verified community beneficiaries (shelters, orphanages, elder care facilities).

The system models realistic food rescue workflows:
1. Donors publish surplus food donations with pickup windows and computed shelf lives.
2. Verified beneficiaries and NGOs register real-time food requests.
3. NGOs dispatch delivery partners with vehicles (including refrigerated fleet units) to transport food either directly to a beneficiary to fulfill an active request or to a designated storage unit.
4. Comprehensive tracking monitors inventory balance, shelf-life freshness, and route statuses.

---

## 2. Technology Stack

- **Frontend**: React 18, Tailwind CSS, React Router v6, Axios, Recharts, Lucide Icons, Vite
- **Backend**: Node.js, Express.js, `mysql2/promise` (connection pooling & transactions), `dotenv`, `cors`, `morgan`
- **Database**: MySQL 8.0 (100% compliant with existing relational schema in `real-schema.sql`)

---

## 3. Database Schema Integrity & Constraints

The existing database schema in [`real-schema.sql`](./real-schema.sql) is strictly preserved without any schema alterations.

### Schema Entities & Key Constraints:

| Table | Primary Key | Key Constraints & Rules |
|---|---|---|
| **`Donor`** | `Donor_id` | `Email` UNIQUE, `FSSAI_License_No` UNIQUE (NULL for individuals). Categorized by `Donor_Type`. |
| **`NGO`** | `NGO_id` | `Email` UNIQUE. Central coordinating hub. |
| **`Beneficiary`** | `Beneficiary_id` | `CHECK (Head_count > 0)`, `Verified_status` ENUM(`Pending`, `Verified`, `Rejected`). |
| **`Food_item`** | `Item_id` | `Item_name` UNIQUE, `CHECK (Expiry_Period_Hours > 0)`. Used to derive dynamic expiry: `Donation_DateTime + INTERVAL Expiry_Period_Hours HOUR`. |
| **`Storage_Unit`** | `Unit_id` | `CHECK (Total_capacity > 0)`. Belongs to exactly one NGO (`fk_unit_ngo`). Real-time utilization dynamically computed from stored donations & deliveries. |
| **`Delivery_partner`** | `Partner_id` | `License_no` UNIQUE, `Type` ENUM(`Volunteer`, `Partner`), optional `NGO_id`. |
| **`Vehicle`** | `Vehicle_id` | Strict 1-to-1 relationship with `Delivery_partner` (`Partner_id` UNIQUE). `CHECK (Capacity > 0)`. Tracks refrigeration capability (`Is_Refrigerated`). Inserted atomically with partner in MySQL transaction. |
| **`Food_donation`** | `Donation_id` | `CHECK (Quantity > 0)`, `Status` ENUM(`Pending`, `Accepted`, `Collected`, `Delivered`, `Cancelled`). |
| **`Food_request`** | `Request_id` | `CHECK (Required_quantity > 0)`, `Status` ENUM(`Open`, `Accepted`, `Fulfilled`, `Cancelled`). |
| **`Delivery`** | `Delivery_id` | **Critical Constraints**:<br>1. `CHECK ((Beneficiary_id IS NULL) <> (Unit_id IS NULL))`: Exactly ONE destination (Beneficiary OR Storage Unit).<br>2. `CHECK ((Beneficiary_id IS NOT NULL) = (Request_id IS NOT NULL))`: Beneficiary delivery requires a `Request_id`; storage unit delivery must have `Request_id` IS NULL.<br>3. `CHECK (Delivery_DateTime IS NULL OR Pickup_DateTime IS NULL OR Delivery_DateTime >= Pickup_DateTime)`: Delivery time must not precede pickup time.<br>4. `Status` ENUM(`Assigned`, `Picked Up`, `In Transit`, `Delivered`, `Cancelled`). |

---

## 4. Project Directory Structure

```
Food Rescue/
├── real-schema.sql            # Master MySQL relational schema
├── package.json               # Root scripts
├── backend/
│   ├── config/
│   │   └── db.js              # MySQL connection pool configuration
│   ├── controllers/
│   │   ├── dashboardController.js   # SQL aggregations & metrics
│   │   ├── donorController.js
│   │   ├── ngoController.js
│   │   ├── beneficiaryController.js
│   │   ├── foodItemController.js
│   │   ├── donationController.js    # Join queries & remaining balances
│   │   ├── requestController.js
│   │   ├── deliveryController.js    # Strict validation of destinations & timestamps
│   │   ├── partnerController.js     # Transactional Partner + Vehicle logic
│   │   └── storageController.js
│   ├── routes/
│   │   └── ...                      # Express REST route definitions
│   ├── middleware/
│   │   └── errorHandler.js          # MySQL error code translations (1451, 1062, 3819)
│   ├── .env                         # Local environment variables
│   ├── .env.example                 # Template for environment variables
│   ├── package.json
│   └── server.js                    # API server entrypoint
└── frontend/
    ├── src/
    │   ├── api/axios.js             # Centralized Axios client with error interceptors
    │   ├── components/
    │   │   ├── Sidebar.jsx          # Responsive navigation drawer
    │   │   ├── Navbar.jsx           # DB health indicator & breadcrumbs
    │   │   ├── DataTable.jsx        # Searchable, filterable, paginated table
    │   │   ├── Modal.jsx            # Modal dialogs for creation, edits & history
    │   │   ├── StatCard.jsx         # KPI widgets
    │   │   ├── StatusBadge.jsx      # Color-coded status badges
    │   │   └── Alert.jsx            # Notification banners
    │   ├── pages/
    │   │   ├── Dashboard.jsx        # Live metrics & Recharts graphs
    │   │   ├── Donors.jsx           # Donor CRUD & donation histories
    │   │   ├── NGOs.jsx             # NGO profiles & associated assets
    │   │   ├── Beneficiaries.jsx    # Verification statuses & requests
    │   │   ├── FoodItems.jsx        # Item catalog & expiry shelf lives
    │   │   ├── Donations.jsx        # Donation pipeline & balance tracking
    │   │   ├── Requests.jsx         # Beneficiary food requests
    │   │   ├── Deliveries.jsx       # Dispatch & delivery tracking
    │   │   ├── Partners.jsx         # Delivery partners & fleet vehicles
    │   │   └── StorageUnits.jsx     # NGO storage capacity monitoring
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## 5. REST API Documentation

### Dashboard
- `GET /api/dashboard/stats`: Aggregated summary KPIs, status pipelines, category volumes, monthly trends, and latest activities.

### Donors
- `GET /api/donors?search=&donorType=`: Retrieve all donors with total donation counts.
- `GET /api/donors/:id`: Specific donor details and complete donation history.
- `POST /api/donors`: Create donor (`Name`, `Phone`, `Email`, `FSSAI_License_No`, `Address`, `Donor_Type`).
- `PUT /api/donors/:id`: Update donor.
- `DELETE /api/donors/:id`: Delete donor (safely checked against FK references).

### NGOs
- `GET /api/ngos?search=`: List NGOs with unit counts and fleet counts.
- `GET /api/ngos/:id`: NGO details with list of managed storage units and partners.
- `POST /api/ngos`: Register NGO (`Name`, `Phone`, `Email`, `Address`).
- `PUT /api/ngos/:id`: Update NGO.
- `DELETE /api/ngos/:id`: Delete NGO.

### Beneficiaries
- `GET /api/beneficiaries?search=&status=`: List beneficiaries.
- `GET /api/beneficiaries/:id`: Beneficiary profile and request history.
- `POST /api/beneficiaries`: Register beneficiary (`Name`, `Phone`, `Email`, `Address`, `Head_count`, `Verified_status`).
- `PUT /api/beneficiaries/:id`: Update beneficiary.
- `PATCH /api/beneficiaries/:id/status`: Update verification status (`Pending`, `Verified`, `Rejected`).
- `DELETE /api/beneficiaries/:id`: Delete beneficiary.

### Food Items
- `GET /api/food-items?search=&category=`: List catalog items.
- `GET /api/food-items/categories`: Distinct categories.
- `POST /api/food-items`: Add catalog item (`Item_name`, `Category`, `Unit`, `Expiry_Period_Hours`).
- `PUT /api/food-items/:id`: Update item.
- `DELETE /api/food-items/:id`: Delete item.

### Food Donations
- `GET /api/donations?status=&donorId=&ngoId=&search=`: Donations with full SQL JOIN data, calculated expiry date, delivered vs remaining quantity balance.
- `GET /api/donations/:id`: Donation details and list of fulfilling deliveries.
- `POST /api/donations`: Create donation (`Donor_id`, `Item_id`, `Quantity`, `NGO_id`, `Unit_id`, `Pickup_window`, `Status`).
- `PUT /api/donations/:id`: Update donation.
- `PATCH /api/donations/:id/status`: Update status (`Pending`, `Accepted`, `Collected`, `Delivered`, `Cancelled`).
- `DELETE /api/donations/:id`: Delete donation.

### Food Requests
- `GET /api/requests?status=&beneficiaryId=&ngoId=`: List requests with fulfilled vs required volume.
- `GET /api/requests/:id`: Request details and fulfilling deliveries.
- `POST /api/requests`: Submit request (`Beneficiary_id`, `NGO_id`, `Item_id`, `Required_by`, `Required_quantity`, `Status`).
- `PUT /api/requests/:id`: Update request.
- `PATCH /api/requests/:id/status`: Update status (`Open`, `Accepted`, `Fulfilled`, `Cancelled`).
- `DELETE /api/requests/:id`: Delete request.

### Deliveries
- `GET /api/deliveries?status=&destinationType=&search=`: Deliveries with transit time, destination names, freshness checks.
- `GET /api/deliveries/:id`: Delivery audit trail.
- `POST /api/deliveries`: Dispatch delivery. Enforces destination mutually exclusive rule and required request ID for beneficiaries.
- `PUT /api/deliveries/:id`: Update delivery.
- `PATCH /api/deliveries/:id/status`: Update status (`Assigned`, `Picked Up`, `In Transit`, `Delivered`, `Cancelled`) and sync timestamps.
- `DELETE /api/deliveries/:id`: Delete delivery.

### Delivery Partners & Fleet
- `GET /api/partners?search=&type=`: Delivery partners with their associated vehicle details.
- `GET /api/partners/vehicles/all`: List all vehicles with partner details.
- `GET /api/partners/:id`: Partner profile, vehicle, and delivery history.
- `POST /api/partners`: Transactional creation of Partner + Vehicle (`START TRANSACTION`, `COMMIT`).
- `PUT /api/partners/:id`: Update partner and vehicle.
- `DELETE /api/partners/:id`: Delete partner (cascades to vehicle).

### Storage Units
- `GET /api/storage-units?ngoId=&storageType=`: Storage units with real-time capacity utilization.
- `GET /api/storage-units/:id`: Storage unit details with incoming deliveries.
- `POST /api/storage-units`: Create storage unit (`NGO_id`, `Unit_name`, `Storage_type`, `Location`, `Total_capacity`).
- `PUT /api/storage-units/:id`: Update storage unit.
- `DELETE /api/storage-units/:id`: Delete storage unit.

---

## 6. How to Run Locally

### Step 1: Configure MySQL Database
Make sure your MySQL 8.0 server is running and the database `food_rescue` is imported:
```bash
# In MySQL CLI or MySQL Workbench:
CREATE DATABASE IF NOT EXISTS food_rescue;
USE food_rescue;
SOURCE real-schema.sql;
```

### Step 2: Configure Backend Environment Variables
In the `backend/` directory, open or create `.env`:
```ini
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE
DB_NAME=food_rescue
```

### Step 3: Run the Application
Open two terminal windows:

**Terminal 1 (Backend API):**
```bash
cd backend
npm run dev
```
The backend will connect to MySQL and start at `http://localhost:5000`.

**Terminal 2 (Frontend UI):**
```bash
cd frontend
npm run dev
```
The frontend will start at `http://localhost:3000`.

---

## 7. Academic DBMS Demonstration Highlights

During your viva or project presentation, highlight these concepts:
1. **Dynamic Derived Attributes**:
   - `Expiry_DateTime` is dynamically calculated in SQL: `DATE_ADD(fd.Donation_DateTime, INTERVAL fi.Expiry_Period_Hours HOUR)` rather than storing redundant data.
   - Storage unit utilization is calculated from live `Food_donation` and `Delivery` data.
2. **Relational CHECK Constraints**:
   - Deliveries strictly follow mutually exclusive destination constraints (`(Beneficiary_id IS NULL) <> (Unit_id IS NULL)`).
   - Time validation (`Delivery_DateTime >= Pickup_DateTime`).
3. **Database Transactions (`ACID`)**:
   - Delivery Partner + Vehicle registration uses `beginTransaction()`, `commit()`, and `rollback()` to guarantee the 1-to-1 relationship without circular foreign key dependencies.
4. **SQL Joins & Aggregations**:
   - Multiple `LEFT JOIN` and `INNER JOIN` operations unify Donors, Items, NGOs, Storage Units, Deliveries, and Beneficiaries for complete end-to-end traceability.
