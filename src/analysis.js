const { getTrips, getDriver, getVehicle } = require("api");

/**
 * This function should return the trip data analysis.
 *
 * @returns {any} Trip data analysis
 */
async function analysis() {
  try {
    // Fetch trip data using the getTrips function and store it in the trips variable.
    const trips = await getTrips();

    // Identify the number of cash trips.
    const cashTrips = trips.filter((obj) => {
      return obj.isCash === true;
    });

    // Identify the number of non-cash trips.
    const nonCashTrips = trips.filter((obj) => {
      return obj.isCash === false;
    });

    // Calculate the sum of the total billed amount for all trips, handling data type variations.
    const sumTotalBilled = trips.reduce((accumulator, obj) => {
      if (typeof obj.billedAmount === "string") {
        return accumulator + parseFloat(obj.billedAmount.replaceAll(",", ""));
      } else if (typeof obj.billedAmount === "number") {
        return accumulator + obj.billedAmount;
      } else {
        return accumulator;
      }
    }, 0);

    // Calculate the sum of the total cash billed amount, considering data type conditions.
    const sumTotalCashBilled = trips.reduce((accumulator, obj) => {
      if (obj.isCash === true && typeof obj.billedAmount === "string") {
        return accumulator + parseFloat(obj.billedAmount.replaceAll(",", ""));
      } else if (obj.isCash === true && typeof obj.billedAmount === "number") {
        return accumulator + obj.billedAmount;
      } else {
        return accumulator;
      }
    }, 0);

    // Calculate the sum of the total non-cash billed amount, again considering data type conditions.
    const sumNonTotalCashBilled = trips.reduce((accumulator, obj) => {
      if (obj.isCash === false && typeof obj.billedAmount === "string") {
        return accumulator + parseFloat(obj.billedAmount.replaceAll(",", ""));
      } else if (obj.isCash === false && typeof obj.billedAmount === "number") {
        return accumulator + obj.billedAmount;
      } else {
        return accumulator;
      }
    }, 0);

    // Map all the driver IDs into a new array.
    const driverIds = trips.map((obj) => {
      return obj.driverID;
    });

    // Create a unique set of driver IDs.
    const driverUnique = [...new Set(driverIds)];

    // Initialize an array to store promises to fetch unique driver data from the drivers list.
    let driverCont = [];

    // Iterate through unique driver IDs and fetch driver information for each.
    driverUnique.forEach((driver) => {
      let driverInfo = getDriver(driver);
      driverCont.push(driverInfo);
    });

    // Settle all promises to remove errors.
    let driverContainer = await Promise.allSettled(driverCont);

    // After settling promises, filter out only drivers with fulfilled promises and extract the values of the driver info.
    const fulfilledDrivers = driverContainer
      .filter((result) => result.status == "fulfilled")
      .map((result) => result.value);

    // Get the count of drivers with multiple vehicles by reducing and checking the length of the vehicle array.
    const multiVehicles = fulfilledDrivers.reduce((acc, obj) => {
      if (obj.vehicleID.length > 1) {
        return (acc += 1);
      } else {
        return acc;
      }
    }, 0);

    // Initialize an object to count all occurrences of the driver's trips.
    let count = {};

    // Identify Driver IDs with the highest number of occurrences (trips).
    driverIds.forEach(function (i) {
      count[i] = (count[i] || 0) + 1;
    });

    // Convert the count object to an array and sort it in descending order.
    const countEntries = Object.entries(count);
    const sortedEntries = countEntries.sort((a, b) => b[1] - a[1]);
    const maxDriverID = sortedEntries[0][0].toString();
    const maxDriverTrips = sortedEntries[0][1];

    // Extract driver information of the driver with the most number of trips.
    const maxDriverDetails = await getDriver(maxDriverID);

    // Extract the total amount earned from trips by the driver with the most trips.
    const maxDriverBilled = trips.reduce((accumulator, obj) => {
      if (obj.driverID == maxDriverID && typeof obj.billedAmount === "string") {
        return accumulator + parseFloat(obj.billedAmount.replaceAll(",", ""));
      } else if (
        obj.driverID == maxDriverID &&
        typeof obj.billedAmount === "number"
      ) {
        return accumulator + obj.billedAmount;
      } else {
        return accumulator;
      }
    }, 0);

    // Initialize an array to store driver statistics for each unique driver.
    const driverTotalContainer = [];

    // Loop through unique drivers and filter their trips into an array.
    for (const key of driverUnique) {
      // Filter out the trips whose driver ID matches the driver IDs in the unique ID list.
      const tripsPerDriver = trips.filter((trip) => trip.driverID == key);

      // Calculate the total billed amount and the number of trips for this driver.
      const totalAmountEarned = tripsPerDriver.reduce((accumulator, obj) => {
        if (typeof obj.billedAmount === "string") {
          return accumulator + parseFloat(obj.billedAmount.replaceAll(",", ""));
        } else if (typeof obj.billedAmount === "number") {
          return accumulator + obj.billedAmount;
        } else {
          return accumulator;
        }
      }, 0);

      const noOfTrips = tripsPerDriver.length;

      // Push unique driver IDs, total amount earned, and the number of trips to the driverTotalContainer array.
      driverTotalContainer.push({
        driverID: key,
        totalAmount: totalAmountEarned,
        noOfTrips: noOfTrips,
      });
    }

    // Sort the driverTotalContainer in descending order based on the total amount earned.
    driverTotalContainer.sort((a, b) => b.totalAmount - a.totalAmount);

    // After sorting in descending order, the highest earning driver is the driver in index 0.
    const highestDriver = driverTotalContainer[0].driverID;

    // Retrieve the information of the highest-earning driver.
    const highestDriverInfo = await getDriver(highestDriver);

    // Create an object containing various analysis results.
    const output = {
      noOfCashTrips: cashTrips.length,
      noOfNonCashTrips: nonCashTrips.length,
      billedTotal: parseFloat(sumTotalBilled.toFixed(2)),
      cashBilledTotal: sumTotalCashBilled,
      nonCashBilledTotal: parseFloat(sumNonTotalCashBilled.toFixed(2)),
      noOfDriversWithMoreThanOneVehicle: multiVehicles,
      mostTripsByDriver: {
        name: maxDriverDetails.name,
        email: maxDriverDetails.email,
        phone: maxDriverDetails.phone,
        noOfTrips: maxDriverTrips,
        totalAmountEarned: maxDriverBilled,
      },
      highestEarningDriver: {
        name: highestDriverInfo.name,
        email: highestDriverInfo.email,
        phone: highestDriverInfo.phone,
        noOfTrips: driverTotalContainer[0].noOfTrips,
        totalAmountEarned: driverTotalContainer[0].totalAmount,
      },
    };

    return output;
  } catch (error) {
    // Handle any errors that occur during the analysis.
    console.error("Data is not available");
  }
}

module.exports = analysis;
