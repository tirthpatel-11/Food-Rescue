-- =====================================================================
--  Smart Food Rescue and Redistribution Network  -  MySQL 8.0.16+ schema
--  Version 2 (simplified design)
--
--  Key design assumptions
--   * Food_item is an independent catalog; donors pick from this list
--     (the app lets them add a new item if it is missing).
--   * One donation = one item type + a quantity.
--   * Each NGO owns its storage units; a unit belongs to exactly one NGO.
--   * Each delivery partner has exactly one vehicle.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS food_rescue
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE food_rescue;

-- ---------------------------------------------------------------------
-- 1. Independent entities - no foreign keys
-- ---------------------------------------------------------------------

CREATE TABLE Donor (
    Donor_id          INT AUTO_INCREMENT PRIMARY KEY,
    Name              VARCHAR(100) NOT NULL,
    Phone             VARCHAR(15)  NOT NULL,
    Email             VARCHAR(100) UNIQUE,
    FSSAI_License_No  VARCHAR(14)  UNIQUE,            -- NULL for individual donors
    Address           VARCHAR(255) NOT NULL,
    Donor_Type        VARCHAR(30)  NOT NULL           -- Restaurant, Hotel, Individual, Event...
);

CREATE TABLE NGO (
    NGO_id   INT AUTO_INCREMENT PRIMARY KEY,
    Name     VARCHAR(100) NOT NULL,
    Phone    VARCHAR(15)  NOT NULL,
    Email    VARCHAR(100) UNIQUE,
    Address  VARCHAR(255) NOT NULL
);

CREATE TABLE Beneficiary (
    Beneficiary_id   INT AUTO_INCREMENT PRIMARY KEY,
    Name             VARCHAR(100) NOT NULL,
    Phone            VARCHAR(15)  NOT NULL,
    Email            VARCHAR(100) UNIQUE,
    Address          VARCHAR(255) NOT NULL,
    Head_count       INT NOT NULL,
    Verified_status  ENUM('Pending', 'Verified', 'Rejected') NOT NULL DEFAULT 'Pending',
    CONSTRAINT chk_beneficiary_headcount CHECK (Head_count > 0)
);

-- Catalog of food types that donors choose from.
-- Expiry_Period_Hours = how long this kind of food stays safe after it is
-- prepared/donated. Actual expiry time of a donation =
--     Donation_DateTime + Expiry_Period_Hours   (calculated, not stored)
CREATE TABLE Food_item (
    Item_id              INT AUTO_INCREMENT PRIMARY KEY,
    Item_name            VARCHAR(100) NOT NULL UNIQUE,
    Category             VARCHAR(50)  NOT NULL,       -- Cooked, Raw, Packaged, Bakery...
    Unit                 VARCHAR(20)  NOT NULL,       -- kg, litre, plate, packet...
    Expiry_Period_Hours  INT NOT NULL,
    CONSTRAINT chk_item_expiry CHECK (Expiry_Period_Hours > 0)
);

-- ---------------------------------------------------------------------
-- 2. Storage_Unit
--    NGO 1 ---- M Storage_Unit  -> NGO_id (every unit has exactly one owner)
-- ---------------------------------------------------------------------

CREATE TABLE Storage_Unit (
    Unit_id         INT AUTO_INCREMENT PRIMARY KEY,
    NGO_id          INT NOT NULL,
    Unit_name       VARCHAR(100) NOT NULL,
    Storage_type    VARCHAR(50)  NOT NULL,            -- Cold, Dry, Frozen...
    Location        VARCHAR(255) NOT NULL,
    Total_capacity  DECIMAL(10,2) NOT NULL,
    -- Current_capacity is DERIVED (dashed in the ER diagram) -> not stored.
    CONSTRAINT fk_unit_ngo
        FOREIGN KEY (NGO_id) REFERENCES NGO(NGO_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_storage_capacity CHECK (Total_capacity > 0)
);

-- ---------------------------------------------------------------------
-- 3. Delivery_partner and Vehicle
-- ---------------------------------------------------------------------

CREATE TABLE Delivery_partner (
    Partner_id  INT AUTO_INCREMENT PRIMARY KEY,
    Name        VARCHAR(100) NOT NULL,
    Phone       VARCHAR(15)  NOT NULL,
    Email       VARCHAR(100) UNIQUE,
    License_no  VARCHAR(30)  UNIQUE,
    Type        ENUM('Volunteer', 'Partner') NOT NULL,
    NGO_id      INT NULL,
    CONSTRAINT fk_partner_ngo
        FOREIGN KEY (NGO_id) REFERENCES NGO(NGO_id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- Delivery_partner 1 ---- 1 Vehicle
--   Partner_id is UNIQUE  -> one vehicle per partner.
--   (To allow several vehicles later, just drop the UNIQUE on Partner_id.)
--   Vehicle_no is UNIQUE  -> the same physical vehicle can't be registered twice.
--   "Every partner must have a vehicle": SQL cannot force this without a
--   circular dependency, so insert the partner and the vehicle together
--   in one transaction from your application.
CREATE TABLE Vehicle (
    Vehicle_id       INT AUTO_INCREMENT PRIMARY KEY,
    Partner_id       INT NOT NULL UNIQUE,
    Vehicle_no       VARCHAR(20) NOT NULL UNIQUE,
    Vehicle_type     VARCHAR(30) NOT NULL,            -- Bike, Van, Truck...
    Capacity         DECIMAL(8,2) NOT NULL,
    Is_Refrigerated  BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_vehicle_partner
        FOREIGN KEY (Partner_id) REFERENCES Delivery_partner(Partner_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_vehicle_capacity CHECK (Capacity > 0)
);

-- ---------------------------------------------------------------------
-- 4. Food_donation
--    Gives   : Donor        1 ---- M Food_donation -> Donor_id
--    Manages : NGO          1 ---- M Food_donation -> NGO_id   (nullable)
--    Stores  : Storage_Unit 1 ---- M Food_donation -> Unit_id  (nullable)
--    Item    : Food_item    1 ---- M Food_donation -> Item_id
-- ---------------------------------------------------------------------

CREATE TABLE Food_donation (
    Donation_id        INT AUTO_INCREMENT PRIMARY KEY,
    Donor_id           INT NOT NULL,
    Item_id            INT NOT NULL,
    Quantity           DECIMAL(10,2) NOT NULL,        -- in the unit defined by Food_item.Unit
    NGO_id             INT NULL,                      -- set once an NGO takes over the donation
    Unit_id            INT NULL,                      -- set once the food is stored somewhere
    Donation_DateTime  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Pickup_window      VARCHAR(50) NOT NULL,          -- e.g. '18:00 - 20:00'
    Pickup_DateTime    DATETIME NULL,
    Status             ENUM('Pending', 'Accepted', 'Collected', 'Delivered', 'Cancelled')
                       NOT NULL DEFAULT 'Pending',
    CONSTRAINT fk_donation_donor
        FOREIGN KEY (Donor_id) REFERENCES Donor(Donor_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_donation_item
        FOREIGN KEY (Item_id) REFERENCES Food_item(Item_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_donation_ngo
        FOREIGN KEY (NGO_id) REFERENCES NGO(NGO_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_donation_unit
        FOREIGN KEY (Unit_id) REFERENCES Storage_Unit(Unit_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_donation_quantity CHECK (Quantity > 0)
);

-- ---------------------------------------------------------------------
-- 5. Food_request
--    Makes    : Beneficiary 1 ---- M Food_request -> Beneficiary_id
--    Receives : NGO         1 ---- M Food_request -> NGO_id
--    Item_id is optional: what kind of food is needed (NULL = any food)
-- ---------------------------------------------------------------------

CREATE TABLE Food_request (
    Request_id         INT AUTO_INCREMENT PRIMARY KEY,
    Beneficiary_id     INT NOT NULL,
    NGO_id             INT NOT NULL,
    Item_id            INT NULL,
    Request_DateTime   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Required_by        DATETIME NOT NULL,
    Required_quantity  DECIMAL(10,2) NOT NULL,
    Status             ENUM('Open', 'Accepted', 'Fulfilled', 'Cancelled')
                       NOT NULL DEFAULT 'Open',
    CONSTRAINT fk_request_beneficiary
        FOREIGN KEY (Beneficiary_id) REFERENCES Beneficiary(Beneficiary_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_request_ngo
        FOREIGN KEY (NGO_id) REFERENCES NGO(NGO_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_request_item
        FOREIGN KEY (Item_id) REFERENCES Food_item(Item_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_request_quantity CHECK (Required_quantity > 0)
);

-- ---------------------------------------------------------------------
-- 6. Delivery
--    Delivery says WHAT is delivered (Donation_id + Quantity), WHO carries
--    it (Delivery_partner_id) and WHERE it goes (a Beneficiary OR a
--    Storage_Unit - exactly one of the two).
--    The item, donor and expiry follow from the donation, so Donor_id is
--    not repeated here.
--    One donation can be split across several deliveries; keeping
--    SUM(Quantity) <= Food_donation.Quantity must be done in the app
--    (or a trigger).
--    (No ON DELETE/UPDATE actions on Beneficiary_id / Unit_id because MySQL
--     forbids them on columns used in a CHECK constraint.)
-- ---------------------------------------------------------------------

CREATE TABLE Delivery (
    Delivery_id          INT AUTO_INCREMENT PRIMARY KEY,
    Donation_id          INT NOT NULL,                -- source: what food is carried
    Request_id           INT NULL,                    -- request being fulfilled (beneficiary deliveries only)
    Quantity             DECIMAL(10,2) NOT NULL,
    Delivery_partner_id  INT NOT NULL,
    NGO_id               INT NOT NULL,
    Beneficiary_id       INT NULL,
    Unit_id              INT NULL,
    Pickup_DateTime      DATETIME NULL,
    Delivery_DateTime    DATETIME NULL,
    Status               ENUM('Assigned', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled')
                         NOT NULL DEFAULT 'Assigned',
    CONSTRAINT fk_delivery_donation
        FOREIGN KEY (Donation_id) REFERENCES Food_donation(Donation_id),
    CONSTRAINT fk_delivery_request
        FOREIGN KEY (Request_id) REFERENCES Food_request(Request_id),
    CONSTRAINT fk_delivery_partner
        FOREIGN KEY (Delivery_partner_id) REFERENCES Delivery_partner(Partner_id),
    CONSTRAINT fk_delivery_ngo
        FOREIGN KEY (NGO_id) REFERENCES NGO(NGO_id),
    CONSTRAINT fk_delivery_beneficiary
        FOREIGN KEY (Beneficiary_id) REFERENCES Beneficiary(Beneficiary_id),
    CONSTRAINT fk_delivery_unit
        FOREIGN KEY (Unit_id) REFERENCES Storage_Unit(Unit_id),
    CONSTRAINT chk_delivery_quantity CHECK (Quantity > 0),
    CONSTRAINT chk_delivery_destination
        CHECK ((Beneficiary_id IS NULL) <> (Unit_id IS NULL)),
    -- beneficiary delivery <=> has a request
    CONSTRAINT chk_delivery_request
        CHECK ((Beneficiary_id IS NOT NULL) = (Request_id IS NOT NULL)),
    CONSTRAINT chk_delivery_times
        CHECK (Delivery_DateTime IS NULL OR Pickup_DateTime IS NULL
               OR Delivery_DateTime >= Pickup_DateTime)
);

ALTER TABLE Donor
ADD COLUMN Temp_note VARCHAR(50);

ALTER TABLE Donor
DROP COLUMN Temp_note;

ALTER TABLE Donor
MODIFY COLUMN Name VARCHAR(100) NOT NULL;

ALTER TABLE NGO
RENAME COLUMN Name TO NGO_Name;

ALTER TABLE NGO
RENAME COLUMN NGO_Name TO Name;