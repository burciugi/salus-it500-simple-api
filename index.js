const request = require('request');



// Salus IT500 credentials
const username = '';
const password = '';
// You can find the device id in the url on the salus device config webpage
const deviceId = '';

// Salus IT500 login url
const loginUrl = 'https://salus-it500.com/public/login.php';
// Salus IT500 device url
const deviceUrl = 'https://salus-it500.com/public/ajax_device_values.php';

// pooling rate, in seconds
const pollIntervalSeconds = 10;
let token = undefined;

function login() {
    request.post({
            url: loginUrl,
            method: 'POST',
            followAllRedirects: true,
            jar: true,
            form: {
                IDemail: username,
                password: password,
                login: 'Login'
            }
        },
        function (err, httpResponse, body) {
            const regex = new RegExp('(?<=id="token" name="token" type="hidden" value=")(.*)(?=\")');
            if (regex.test(body)) {
                token = regex.exec(body)[0];
            } else {
                console.log('Cannot parse token.')
                token = undefined;
            }
        },
        function (err, httpResponse, body) {
            token = undefined;
            console.log(err);
        });
}

function getTemperatures(token, callback) {
    const responseDevice = request.get(`${deviceUrl}?devId=${deviceId}&token=${token}`,
        (err, httpResponse, body) => {
            try {
                callback(JSON.parse(body));
            } catch (error) {
                token = undefined;
            }

        },
        function (err, httpResponse, body) {
            token = undefined;
        });

}

function poll() {
    if (typeof token === 'undefined') {
        console.log('Token expired or error occured during login, getting new token.');
        login();

        return;
    }

    getTemperatures(token, (result) => {
        console.log({
            temp: parseFloat(result.CH1currentRoomTemp),
            target: parseFloat(result.CH1currentSetPoint),
            heatStatus: result.CH1heatOnOffStatus === '1' ? true : false,
            timestamp: new Date()
        })
    });
}

function init() {
    setInterval(() => poll(), pollIntervalSeconds * 1000);
}

init();