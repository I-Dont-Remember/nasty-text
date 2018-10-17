/* sheets:
    Functions for interaction with the Google Sheets API.
*/

const { google } = require("googleapis");
const privatekey = require("./googleCredentials.json");
const signupSpreadsheetId = "12CgCC6HV9ZJGO8EePqo9PNmy-7UY6GTL1atG8gSItnE";

// configure a JWT auth client
const jwtClient = new google.auth.JWT(
    privatekey.client_email,
    null,
    privatekey.private_key,
    ["https://www.googleapis.com/auth/spreadsheets"]
);
// authenticate request
jwtClient.authorize(function(err, tokens) {
    if (err) {
        console.log("ERROR AUTHORIZING GOOGLE SHEETS API: ", err);
        return;
    } else {
        console.log("Successfully connected");
    }
});

function test() {
    let spreadsheetId = signupSpreadsheetId;
    let sheetRange = "A1:A2";
    let sheets = google.sheets("v4");
    sheets.spreadsheets.values.get(
        {
            auth: jwtClient,
            spreadsheetId: signupSpreadsheetId,
            range: sheetRange
        },
        function(err, response) {
            if (err) {
                console.log("Sheets API returned an error: ", err);
            } else {
                console.log("List from Sheets:");
                console.log("response: ", response.data.values);
            }
        }
    );
}

/**
 * Print the location and time of practice for today
 */
function gymnasticsInfoLogistics(auth, returnMsgFunc) {
    let sheets = google.sheets("v4");
    sheets.spreadsheets.values.get(
        {
            auth: auth,
            spreadsheetId: "1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ",
            range: "C28:D37"
        },
        function(err, response) {
            if (err) {
                console.log("The API returned an error: " + err);
                return "The program failed, sign up using the sheet. Sorry :(";
            }
            let rows = response.values;
            if (rows != undefined) {
                let date = new Date();
                let day = date.getDay();
                if (day == 5 || day == 6) {
                    returnMsgFunc("There is no practice today.");
                    return;
                }
                let info = rows[day][1] + ", " + rows[day + 1][1];
                if (day == 0) {
                    info += "\nPickup is at 5:40";
                } else {
                    info += "\nPickup is at 8:10";
                }
                returnMsgFunc(info);
                return;
            }
        }
    );
}

/**
 * Print the names and pickup locations of students in the spreadsheet:
 * https://docs.google.com/spreadsheets/d/1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ
 */
function gymnasticsInfoPeople(auth, returnMsgFunc) {
    let sheets = google.sheets("v4");
    sheets.spreadsheets.values.get(
        {
            auth: auth,
            spreadsheetId: "1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ",
            range: "H9:R40"
        },
        function(err, response) {
            if (err) {
                console.log("The API returned an error: " + err);
                return "The program failed, sign up using the sheet. Sorry :(";
            }
            let rows = response.values;
            let people = [];
            if (rows != undefined) {
                for (let rowNum = 0; rowNum < rows.length; rowNum++) {
                    let row = rows[rowNum];
                    if (
                        row[0] != "" &&
                        row[0] != undefined &&
                        row[0] != "McDonalds" &&
                        row[0] != "New Member (not on list)"
                    )
                        people.push(row[0]);
                    if (
                        row[2] != "" &&
                        row[2] != undefined &&
                        row[2] != "Hub" &&
                        row[2] != "New Member (not on list)"
                    )
                        people.push(row[2]);
                    if (
                        row[6] != "" &&
                        row[6] != undefined &&
                        row[6] != "Porter" &&
                        row[6] != "New Member (not on list)"
                    )
                        people.push(row[6]);
                    if (
                        row[10] != "" &&
                        row[10] != undefined &&
                        row[10] != "I'll Be There and can drive if needed" &&
                        row[10] != "I'll Be there - No ride needed" &&
                        row[10] != "New Member (not on list)"
                    )
                        people.push(row[10]);
                }
            }
            let returnMessage = "";
            for (let i = 0; i < people.length; i++) {
                returnMessage += people[i];
                returnMessage += "\n";
            }
            returnMsgFunc(returnMessage);
            return;
        }
    );
}

/*
 * Sign up on the sheet
 * TODO: deal with if people sign up for the same spot at the same time
 */
function gymnasticsSignUp(auth, returnMsgFunc, user) {
    const name = user.name;
    const pickupLocation = user.pickupLocation;
    const driver = user.isDriver;

    let date = new Date();
    let day = date.getDay();
    if (day == 5 || day == 6) {
        returnMsgFunc("There is no practice today");
        return;
    }
    let time = date.getHours();
    if ((day == 0 && time >= 15) || (day >= 1 && day <= 4 && time >= 17)) {
        console.log(day);
        console.log(time);
        returnMsgFunc("It's past the sign up time, text Morgan to sign up");
        return;
    }

    let sheets = google.sheets("v4");
    let a1notation;
    sheets.spreadsheets.values.get(
        {
            auth: auth,
            spreadsheetId: "1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ",
            range: "H9:R40"
        },
        function(err, response) {
            if (err) {
                console.log("The API returned an error: " + err);
                returnMsgFunc(
                    "The program failed, sign up using the sheet. Sorry :("
                );
                return;
            }
            let rows = response.values;
            let a1notation;
            let a1notationA;
            let a1notationB;
            let places;
            if (rows != undefined) {
                //find these values from database?
                if (justRideBack) {
                    places = [0, 1, 2, 3, 4, 5, 6, 7, 8];
                    for (let i = 0; i < places.length; i++) {
                        if (
                            rows[places[i]][10] == undefined ||
                            rows[places[i]][10] == ""
                        ) {
                            a1notationA =
                                "R" + (9 + places[i]) + ":R" + (9 + places[i]);
                            a1notationB =
                                "S" + (9 + places[i]) + ":S" + (9 + places[i]);
                            break;
                        }
                    }
                    sheets.spreadsheets.values.update(
                        {
                            spreadsheetId:
                                "1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ",
                            range: a1notationA,
                            valueInputOption: "RAW",
                            resource: {
                                values: [[name]]
                            },
                            auth: auth
                        },
                        function(err, response) {
                            if (err) {
                                console.log(
                                    "The API returned an error: " + err
                                );
                                returnMsgFunc(
                                    "The program failed, sign up using the sheet. Sorry :("
                                );
                                return;
                            } else {
                                returnMsgFunc("You are signed up");
                                return;
                            }
                        }
                    );
                    sheets.spreadsheets.values.update(
                        {
                            spreadsheetId:
                                "1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ",
                            range: a1notationB,
                            valueInputOption: "RAW",
                            resource: {
                                values: [[user.pickupLocation]]
                            },
                            auth: auth
                        },
                        function(err, response) {
                            if (err) {
                                console.log(
                                    "The API returned an error: " + err
                                );
                                returnMsgFunc(
                                    "The program failed, sign up using the sheet. Sorry :("
                                );
                                return;
                            }
                        }
                    );
                } else if (canDrive) {
                    places = [10, 11, 12, 13, 14, 15, 16];
                    for (let i = 0; i < places.length; i++) {
                        if (
                            rows[places[i]][10] == undefined ||
                            rows[places[i]][10] == ""
                        ) {
                            a1notationA =
                                "R" + (9 + places[i]) + ":R" + (9 + places[i]);
                            a1notationB =
                                "S" + (9 + places[i]) + ":S" + (9 + places[i]);
                            break;
                        }
                    }
                    sheets.spreadsheets.values.update(
                        {
                            spreadsheetId:
                                "1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ",
                            range: a1notationA,
                            valueInputOption: "RAW",
                            resource: {
                                values: [[name]]
                            },
                            auth: auth
                        },
                        function(err, response) {
                            if (err) {
                                console.log(
                                    "The API returned an error: " + err
                                );
                                returnMsgFunc(
                                    "The program failed, sign up using the sheet. Sorry :("
                                );
                                return;
                            } else {
                                returnMsgFunc("You are signed up");
                            }
                        }
                    );
                    sheets.spreadsheets.values.update(
                        {
                            spreadsheetId:
                                "1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ",
                            range: a1notationB,
                            valueInputOption: "RAW",
                            resource: {
                                values: [[when]]
                            },
                            auth: auth
                        },
                        function(err, response) {
                            if (err) {
                                console.log(
                                    "The API returned an error: " + err
                                );
                                returnMsgFunc(
                                    "The program failed, sign up using the sheet. Sorry :("
                                );
                                return;
                            }
                        }
                    );
                } else if (noRide) {
                    places = [18, 19, 20, 21, 22, 23, 24, 25, 26];
                    for (let i = 0; i < places.length; i++) {
                        if (
                            rows[places[i]][10] == undefined ||
                            rows[places[i]][10] == ""
                        ) {
                            a1notation =
                                "R" + (9 + places[i]) + ":R" + (9 + places[i]);
                            break;
                        }
                    }
                } else {
                    if (pickupLocation == "McDonalds") {
                        if (driver) {
                            places = [0, 6, 12, 18];
                        } else {
                            places = [
                                1,
                                2,
                                3,
                                4,
                                7,
                                8,
                                9,
                                10,
                                13,
                                14,
                                15,
                                16,
                                19,
                                20,
                                21,
                                22
                            ];
                        }
                        for (let i = 0; i < places.length; i++) {
                            if (
                                rows[places[i]][0] == undefined ||
                                rows[places[i]][0] == ""
                            ) {
                                a1notation =
                                    "H" +
                                    (9 + places[i]) +
                                    ":H" +
                                    (9 + places[i]);
                                break;
                            }
                        }
                    }
                    if (pickupLocation == "Hub") {
                        if (driver) {
                            places = [0, 6, 12, 18];
                        } else {
                            places = [
                                1,
                                2,
                                3,
                                4,
                                7,
                                8,
                                9,
                                10,
                                13,
                                14,
                                15,
                                16,
                                19,
                                20,
                                21,
                                22
                            ];
                        }
                        for (let i = 0; i < places.length; i++) {
                            if (
                                rows[places[i]][2] == undefined ||
                                rows[places[i]][2] == ""
                            ) {
                                a1notation =
                                    "J" +
                                    (9 + places[i]) +
                                    ":J" +
                                    (9 + places[i]);
                                break;
                            }
                        }
                    }
                    if (pickupLocation == "Porter") {
                        if (driver) {
                            places = [0, 6, 12, 18];
                        } else {
                            places = [
                                1,
                                2,
                                3,
                                4,
                                7,
                                8,
                                9,
                                10,
                                13,
                                14,
                                15,
                                16,
                                19,
                                20,
                                21,
                                22
                            ];
                        }
                        for (let i = 0; i < places.length; i++) {
                            if (
                                rows[places[i]][6] == undefined ||
                                rows[places[i]][6] == ""
                            ) {
                                a1notation =
                                    "N" +
                                    (9 + places[i]) +
                                    ":N" +
                                    (9 + places[i]);
                                break;
                            }
                        }
                    }
                }
                sheets.spreadsheets.values.update(
                    {
                        spreadsheetId:
                            "1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ",
                        range: a1notation,
                        valueInputOption: "RAW",
                        resource: {
                            values: [[name]]
                        },
                        auth: auth
                    },
                    function(err, response) {
                        if (err) {
                            console.log("The API returned an error: " + err);
                            returnMsgFunc(
                                "The program failed, sign up using the sheet. Sorry :("
                            );
                            return;
                        } else {
                            let returnMessage = "You are signed up";
                            if (driver) {
                                returnMessage += " as a driver";
                            }
                            returnMsgFunc(returnMessage);
                            return;
                        }
                    }
                );
            }
        }
    );
}

function gymnasticsCancel(auth, returnMsgFunc, name) {
    let date = new Date();
    let day = date.getDay();
    let time = date.getHours();
    if (day == 5 || day == 6) {
        returnMsgFunc("There is no practice today");
        return;
    }
    if ((day == 0 && time >= 16) || (day >= 1 && day <= 4 && time >= 18)) {
        returnMsgFunc("It is past the cancel time, text Morgan to cancel");
        return;
    }

    let sheets = google.sheets("v4");
    sheets.spreadsheets.values.get(
        {
            auth: auth,
            spreadsheetId: "1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ",
            range: "H9:R40"
        },
        function(err, response) {
            if (err) {
                console.log("The API returned an error: " + err);
                returnMsgFunc(
                    "The program failed, cancel using the sheet. Sorry :("
                );
                return;
            }
            let rows = response.values;
            let a1notation = "";
            let realRowNum = 9;
            if (rows != undefined) {
                for (let rowNum = 0; rowNum < rows.length; rowNum++) {
                    let row = rows[rowNum];
                    if (row[0] == name) {
                        a1notation = "H" + realRowNum + ":" + "H" + realRowNum;
                        break;
                    } else if (row[2] == name) {
                        a1notation = "J" + realRowNum + ":" + "J" + realRowNum;
                        break;
                    } else if (row[6] == name) {
                        a1notation = "N" + realRowNum + ":" + "N" + realRowNum;
                        break;
                    } else if (row[10] == name) {
                        a1notation = "R" + realRowNum + ":" + "R" + realRowNum;
                        break;
                    } else {
                        realRowNum++;
                    }
                }
                sheets.spreadsheets.values.update(
                    {
                        spreadsheetId:
                            "1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ",
                        range: a1notation,
                        valueInputOption: "RAW",
                        resource: {
                            values: [[""]]
                        },
                        auth: auth
                    },
                    function(err, response) {
                        if (err) {
                            console.log("The API returned an error: " + err);
                            returnMsgFunc(
                                "The program failed, cancel using the sheet. Sorry :("
                            );
                            return;
                        } else {
                            returnMsgFunc(
                                "Your name has been removed from the sheet"
                            );
                            return;
                        }
                    }
                );
            }
        }
    );
}

function gymnasticsCheckStatus(
    auth,
    returnMsgFunc,
    user,
    sign,
    cancel,
    driver
) {
    const name = user.name;
    if (sign == true && cancel == true) {
        returnMsgFunc("You cannot sign up and cancel at the same time.");
        return;
    }
    let sheets = google.sheets("v4");
    sheets.spreadsheets.values.get(
        {
            auth: auth,
            spreadsheetId: "1-Lxy_dX73c3-xUHJ-43lBB8ciMdvAOviSS6xWFCypsQ",
            range: "H9:R40"
        },
        function(err, response) {
            if (err) {
                console.log("The API returned an error: " + err);
                returnMsgFunc(
                    "The program screwed up, use the sheet, sorry :("
                );
                return;
            }
            let rows = response.values;
            let status = false;
            if (rows != undefined) {
                for (let rowNum = 0; rowNum < rows.length; rowNum++) {
                    let row = rows[rowNum];
                    if (row[0] == name) {
                        status = true;
                        break;
                    } else if (row[2] == name) {
                        status = true;
                        break;
                    } else if (row[6] == name) {
                        status = true;
                        break;
                    } else if (row[10] == name) {
                        status = true;
                        break;
                    } else {
                    }
                }
            }
            if (status) {
                if (sign) {
                    returnMsgFunc("You are already signed up");
                    return;
                } else if (cancel) {
                    gymnasticsCancel(auth, returnMsgFunc, name);
                    return;
                } else {
                    returnMsgFunc("You are already signed up.");
                    return;
                }
            } else {
                if (sign) {
                    gymnasticsSignUp(auth, returnMsgFunc, user);
                    return;
                } else {
                    returnMsgFunc("You are not signed up.");
                    return;
                }
            }
        }
    );
}

function signUp(user, sendText) {
    editSheet(user, true, false, gymnasticsCheckStatus, function(msg) {
        sendText(msg);
    });
}
function cancel(user, sendText) {
    editSheet(user, false, true, gymnasticsCheckStatus, function(msg) {
        sendText(msg);
    });
}
function checkStatus(user, sendText) {
    editSheet(user, false, false, gymnasticsCheckStatus, function(msg) {
        sendText(msg);
    });
}
function infoPeople(sendText) {
    editSheet(null, false, false, gymnasticsInfoPeople, function(msg) {
        sendText(msg);
    });
}
function infoLogistics(sendText) {
    editSheet(null, false, false, gymnasticsInfoLogistics, function(msg) {
        sendText(msg);
    });
}

module.exports = {
    signUp: signUp,
    cancel: cancel,
    checkStatus: checkStatus,
    infoPeople: infoPeople,
    infoLogistics: infoLogistics
};
