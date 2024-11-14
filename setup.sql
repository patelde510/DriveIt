
DROP DATABASE IF EXISTS postgres;
CREATE DATABASE postgres;
\c postgres;


-- Create the tables

CREATE TABLE CUSTOMER (
    custId SERIAL PRIMARY KEY,
    name VARCHAR(50),
    address VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(2),
    country VARCHAR(50),
    email VARCHAR(100),
    favorites JSON,
    username VARCHAR(20) NOT NULL,
    password VARCHAR(100) NOT NULL
);

CREATE TABLE REVIEW (
    reviewID INT PRIMARY KEY,
    custID INT,
    make VARCHAR(20),
    model VARCHAR(20),
    rating INT CHECK (Rating BETWEEN 1 AND 5),
    comments VARCHAR(200)
);

CREATE TABLE VEHICLE (
    vin VARCHAR(17) PRIMARY KEY,
    make VARCHAR(20),
    model VARCHAR(20),
    bodyType VARCHAR(20),
    driveTrain VARCHAR(10),
    price INT,
    mileage INT,
    condition VARCHAR(4) CHECK (Condition IN ('New', 'Used')),
    yearOfManufacture INT,
    status VARCHAR(10) CHECK (Status IN ('Available', 'Pending', 'Sold')),
    reviewId INT
);

CREATE TABLE SPECS (
    specId INT PRIMARY KEY,
    vin VARCHAR(17),
    exteriorColor VARCHAR(50),
    interiorColor VARCHAR(50),
    engineType VARCHAR(10) CHECK (engineType IN ('Gas', 'Hybrid', 'Electric')),
    numberOfSeats INT,
    transmission VARCHAR(10) CHECK (Transmission IN ('Manual', 'Automatic')),
    fuelType VARCHAR(15),
    otherUpgrades JSON
);

-- Add all foreign key references

ALTER TABLE REVIEW
ADD CONSTRAINT fk_review_customer
FOREIGN KEY (custId) REFERENCES CUSTOMER(custId);

ALTER TABLE VEHICLE
ADD CONSTRAINT fk_vehicle_review
FOREIGN KEY (reviewId) REFERENCES REVIEW(reviewId);

ALTER TABLE SPECS
ADD CONSTRAINT fk_specs_vehicle
FOREIGN KEY (vin) REFERENCES VEHICLE(vin);

\q