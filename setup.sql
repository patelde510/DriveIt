
DROP DATABASE IF EXISTS driveit;
CREATE DATABASE driveit;
\c driveit


-- Create the tables

CREATE TABLE CUSTOMER (
    custId INT PRIMARY KEY,
    vin VARCHAR(17),
    name VARCHAR(50),
    ssn INT,
    address VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(2),
    country VARCHAR(50),
    email VARCHAR(100),
    favorites JSON,
    username VARCHAR(20),
    password VARCHAR(100)
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

-- Populate the tables

INSERT INTO VEHICLE (VIN, Make, Model, bodyType, driveTrain, Price, Mileage, Condition, yearOfManufacture, Status, reviewID)
VALUES 
('1HGCM82633A123456', 'Honda', 'Accord', 'Sedan', 'FWD', 22000, 15000, 'Used', 2021, 'Available', 1),
('3CZRE4H52BG706551', 'Honda', 'CR-V', 'SUV', 'AWD', 28000, 5000, 'Used', 2022, 'Pending', 2),
('1FTFW1EF1BFA12345', 'Ford', 'F-150', 'Truck', '4WD', 35000, 10000, 'New', 2023, 'Sold', 3),
('1N4AL3AP3JC123456', 'Nissan', 'Altima', 'Sedan', 'FWD', 18000, 20000, 'Used', 2020, 'Available', 4),
('5YJ3E1EA7JF123456', 'Tesla', 'Model 3', 'Sedan', 'RWD', 45000, 3000, 'New', 2023, 'Available', 5);

INSERT INTO SPECS (specID, VIN, exteriorColor, interiorColor, engineType, numberOfSeats, Transmission, fuelType, otherUpgrades)
VALUES
(1, '1HGCM82633A123456', 'Silver', 'Black', 'Gas', 5, 'Automatic', 'Gasoline', JSON_ARRAY('Sunroof', 'Leather seats')),
(2, '3CZRE4H52BG706551', 'Blue', 'Gray', 'Gas', 5, 'Automatic', 'Gasoline', JSON_ARRAY('Alloy wheels', 'Heated seats')),
(3, '1FTFW1EF1BFA12345', 'Red', 'Black', 'Gas', 6, 'Automatic', 'Gasoline', JSON_ARRAY('Towing package', 'Bed liner')),
(4, '1N4AL3AP3JC123456', 'White', 'Beige', 'Gas', 5, 'Manual', 'Gasoline', JSON_ARRAY('Navigation', 'Bluetooth')),
(5, '5YJ3E1EA7JF123456', 'Black', 'White', 'Electric', 5, 'Automatic', 'Electricity', JSON_ARRAY('Autopilot', 'Premium audio'));

INSERT INTO REVIEW (reviewID, custID, Make, Model, Rating, Comments)
VALUES
(1, 101, 'Honda', 'Accord', 4, 'Very reliable and smooth ride.'),
(2, 102, 'Honda', 'CR-V', 5, 'Perfect for family trips and great handling.'),
(3, 103, 'Ford', 'F-150', 4, 'Powerful truck, but a bit heavy on gas.'),
(4, 104, 'Nissan', 'Altima', 3, 'Affordable but lacks advanced features.'),
(5, 105, 'Tesla', 'Model 3', 5, 'Amazing tech and very efficient on energy.');

INSERT INTO CUSTOMER (custID, VIN, Name, SSN, Address, City, State, Country, Email, Favorites, Username, Password)
VALUES
(101, '1HGCM82633A123456', 'Alice Smith', 123456789, '123 Elm St', 'Philadelphia', 'PA', 'USA', 'alice@example.com', JSON_ARRAY('1HGCM82633A123456', '5YJ3E1EA7JF123456'), 'alice_smith', 'hashed_password_101'),
(102, '3CZRE4H52BG706551', 'Bob Johnson', 987654321, '456 Oak St', 'New York', 'NY', 'USA', 'bob@example.com', JSON_ARRAY('3CZRE4H52BG706551', '1N4AL3AP3JC123456'), 'bob_johnson', 'hashed_password_102'),
(103, '1FTFW1EF1BFA12345', 'Charlie Brown', 192837465, '789 Pine St', 'Los Angeles', 'CA', 'USA', 'charlie@example.com', JSON_ARRAY('1FTFW1EF1BFA12345', '1HGCM82633A123456'), 'charlie_brown', 'hashed_password_103'),
(104, '1N4AL3AP3JC123456', 'Dana White', 564738291, '321 Maple St', 'Chicago', 'IL', 'USA', 'dana@example.com', JSON_ARRAY('1N4AL3AP3JC123456'), 'dana_white', 'hashed_password_104'),
(105, '5YJ3E1EA7JF123456', 'Eva Green', 746291385, '654 Birch St', 'Houston', 'TX', 'USA', 'eva@example.com', JSON_ARRAY('5YJ3E1EA7JF123456', '3CZRE4H52BG706551'), 'eva_green', 'hashed_password_105');


-- Add all foreign key references

ALTER TABLE CUSTOMER
ADD CONSTRAINT fk_customer_vehicle
FOREIGN KEY (vin) REFERENCES VEHICLE(vin);

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