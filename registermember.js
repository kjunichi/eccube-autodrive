const cluster = require('cluster');
const request = require('request');
const Nightmare = require('nightmare');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
//const HOST = 'localhost';
const HOST = '192.168.99.100';
const numClients = 5;
if (cluster.isMaster) {
    function mailProc() {

        function regist(id) {
            request(`http://${HOST}:1080/messages/${id}.plain`, (error, response, body) => {
                const lines = body.split(/\n/);
                let mailCount = 0;
                for (let line of lines) {
                    //console.log(line)
                    if (line.startsWith('https') && line.indexOf('/entry/activate/') != -1) {
                        request(line, (error, response, body) => {
                            //console.log(error);
                            //console.log(response);
                            //console.log(body);
                        });
                        console.log(`${mailCount} ${line}`);
                        mailCount++;
                        if (mailCount >= lines.length) {
                            request({
                                    method: 'DELETE',
                                    uri: `http://${HOST}:1080/messages`
                                },
                                (error, response, body) => {
                                    console.log(`mail delete.`);
                                });
                        }
                    }
                }
                //parseMail(JSON.parse(body));
            });
        }

        function parseMail(json) {
            for (let i = 0; i < json.length; i++) {
                //console.log(i,json[i]);
                if (json[i].recipients[0] != 'admin@example.com') {
                    regist(json[i].id);
                }
            }
        }
        request(`http://${HOST}:1080/messages`, (error, response, body) => {
            //console.log(JSON.parse(body));
            parseMail(JSON.parse(body));
        })
    }

    console.log(`Master ${process.pid} is running`);

    function delayStart(p,num) {
        if (num < 1) {
            return;
        }
        setTimeout(() => {
            cluster.setupMaster({
                args: [`id${p}${num}`]
            });
            cluster.fork();
            delayStart(p, num - 1);
        }, 100);
    }
    // Fork workers.
    delayStart(0,numClients);

    let numProc = 1;

    let numWokers = numClients;
    cluster.on('exit', (worker, code, signal) => {
        console.log(`${numWokers} range : ${worker.id}`);
        console.log(`worker ${worker.process.pid} died`);
        numWokers = numWokers - 1;
        if (numWokers < 2) {
            //process.exit(0);
            mailProc();
            delayStart(numProc,numClients);
            numProc = numProc - 1;
            if (numProc < 1) {
                //process.exit(1);
                console.log(`end`);
            }
        }
    });
} else {


    const nightmare = Nightmare({
        show: false,
        typeInterval: 10,
        switches: {
            'ignore-certificate-errors': null
        }
    });

    function preRegist(num) {

        const email = `testf${process.argv.slice(2)}${num}@nergal.lan`;
        console.log(`start num = ${num}`);
        nightmare
            .goto(`https://${HOST}:8443/`)
            .wait(".member_link li a[href*=\"/entry\"]")
            .click(".member_link li a[href*=\"/entry\"]")
            //.wait("#zip-search")
            .wait(400)
            .type("#entry_name_name01", `試験`)
            .type("#entry_name_name02", `与太郎`)
            .type("#entry_kana_kana01", "カタカナ")
            .type("#entry_kana_kana02", "カタカナ")
            .type("#zip01", "164")
            .type("#zip02", "0001")
            //.wait(300)
            .click("#zip-search")
            .wait(800)
            .type("#addr02", "試験1-2-3")
            .type("#entry_tel_tel01", "03")
            .type("#entry_tel_tel02", "1234")
            .type("#entry_tel_tel03", "1234")
            .type("#entry_email_first", email)
            .type("#entry_email_second", email)
            .type("#entry_password_first", "abcde123")
            .type("#entry_password_second", "abcde123")
            .click("button.btn-primary")
            //.wait("button.btn-primary")
            .wait(800)
            //.pdf("cube.pdf")
            .click("button.btn-primary")
            .wait(800)
            .evaluate(() => {
                return document.body.innerHTML;
                //const e1 = document.querySelectorAll('.member_link li');

                //return e1['0'].href;
            })
            .then((result) => {
                //console.log(result);
                console.log(`${process.argv.slice(2)} : ${num} done.`);
                if (num > 0) {
                    preRegist(num - 1);
                } else {
                    //mailProc();
                    nightmare.end();
                    process.exit(0);
                }
            })
            .catch((error) => {
                console.error(`${process.argv.slice(2)} : ${num} failed:`, error);
                //console.log(result);

                if (num > 0) {
                    preRegist(num - 1);
                } else {
                    //mailProc();
                    nightmare.end();
                    process.exit(0);
                }

            });
    }

    preRegist(1);
}
//mailProc();