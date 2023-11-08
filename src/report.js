const { getTrips } = require('api');

/**
 * This function returns driver data in a specified format.
 *
 * @returns {Promise<any>} Driver report data
 */
async function driverReport() {
  try {
    // Fetch the trip data using the getTrips function
    const trips = await getTrips();

    // Initialize an object to store driver data
    const driverData = {};

    // Iterate through the trips and collect driver-related information
    for (const trip of trips) {
      // Initialize driver data if not present in the driverData object
      if (!driverData[trip.driverID]) {
        driverData[trip.driverID] = {
          name: trip.driverName,
          email: trip.driverEmail,
          phone: trip.driverPhone,
          noOfTrips: 0,
          totalAmountEarned: 0,
          vehicles: new Set(),
          trips: [],
          cashTrips: 0,
          nonCashTrips: 0,
          cashBilledTotal: 0,
          nonCashBilledTotal: 0,
        };
      }

      // Update cash and non-cash trip counts and billed amounts for the driver
      if (trip.isCash) {
        driverData[trip.driverID].cashTrips++;
        driverData[trip.driverID].cashBilledTotal += trip.billedAmount;
      } else {
        driverData[trip.driverID].nonCashTrips++;
        driverData[trip.driverID].nonCashBilledTotal += trip.billedAmount;
      }

      // Update the total amount earned by the driver
      driverData[trip.driverID].totalAmountEarned += trip.billedAmount;

      // Update driver's trip information
      driverData[trip.driverID].trips.push({
        user: trip.userName,
        created: trip.dateCreated,
        pickup: trip.pickupAddress,
        destination: trip.destinationAddress,
        billed: trip.billedAmount,
        isCash: trip.isCash,
      });

      // Update the total number of trips taken by the driver
      driverData[trip.driverID].noOfTrips++;

      // Update driver's vehicles (assuming the vehicle information is available)
      if (trip.vehiclePlate && trip.vehicleManufacturer) {
        const vehicleKey = `${trip.vehiclePlate}-${trip.vehicleManufacturer}`;
        driverData[trip.driverID].vehicles.add(vehicleKey);
      }
    }

    // Convert vehicle Set to an array for each driver
    for (const driverID in driverData) {
      driverData[driverID].vehicles = [...driverData[driverID].vehicles];
    }

    // Identify the driver with the most trips
    const mostTripsByDriver = Object.values(driverData).reduce((mostTrips, driver) =>
      (!mostTrips || driver.noOfTrips > mostTrips.noOfTrips) ? driver : mostTrips, null);

    // Identify the driver with the highest earnings
    const highestEarningDriver = Object.values(driverData).reduce((highestEarning, driver) =>
      (!highestEarning || driver.totalAmountEarned > highestEarning.totalAmountEarned) ? driver : highestEarning, null);

    // Prepare the final driver report data
    const drivers = Object.values(driverData);

    const driverReportData = {
      drivers,
      noOfDriversWithMoreThanOneVehicle: drivers.filter(driver => driver.vehicles.length > 1).length,
      mostTripsByDriver,
      highestEarningDriver,
    };

    return driverReportData;
  } catch (error) {
    // Handle errors and log them
    console.error('An error occurred while fetching or processing data:', error);
    throw error;
  }
}

module.exports = driverReport;

