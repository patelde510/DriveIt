DROP DATABASE IF EXISTS driveit;
CREATE DATABASE driveit;
\c driveit

-- Create the tables

CREATE TABLE customer (
    custid SERIAL PRIMARY KEY,
    name VARCHAR(50),
    address VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(2),
    country VARCHAR(50),
    email VARCHAR(100),
    favorites JSON,
    username VARCHAR(20) NOT NULL,
    password VARCHAR(100) NOT NULL,
    sessionid UUID
);

CREATE TABLE review (
    reviewid SERIAL PRIMARY KEY,
    vin VARCHAR(17),
    custid INT,
    make VARCHAR(20),
    model VARCHAR(20),
    comments VARCHAR(200),
    CONSTRAINT fk_review_customer FOREIGN KEY (custid) REFERENCES customer(custid)
);

CREATE TABLE vehicle (
    vin VARCHAR(17) PRIMARY KEY,
    make VARCHAR(20),
    model VARCHAR(20),
    bodytype VARCHAR(20),
    drivetrain VARCHAR(10),
    price INT,
    mileage INT,
    condition VARCHAR(4),
    yearofmanufacture INT,
    status VARCHAR(10),
    reviewid INT,
    image_url VARCHAR(500),
    CONSTRAINT fk_vehicle_review FOREIGN KEY (reviewid) REFERENCES review(reviewid)
);

ALTER TABLE review
    ADD CONSTRAINT fk_review_vin FOREIGN KEY (vin) REFERENCES vehicle(vin);

CREATE TABLE specs (
    specid SERIAL PRIMARY KEY,
    vin VARCHAR(17),
    exteriorcolor VARCHAR(50),
    interiorcolor VARCHAR(50),
    enginetype VARCHAR(10),
    numberofseats INT,
    transmission VARCHAR(10),
    fueltype VARCHAR(30),
    CONSTRAINT fk_specs_vehicle FOREIGN KEY (vin) REFERENCES vehicle(vin)
);

CREATE TABLE favorites (
    favoriteid SERIAL PRIMARY KEY,
    custid INT,
    vin VARCHAR(17),
    CONSTRAINT fk_favorites_customer FOREIGN KEY (custid) REFERENCES customer(custid),
    CONSTRAINT fk_favorites_vehicle FOREIGN KEY (vin) REFERENCES vehicle(vin)
);

\q
