const cluster = require('cluster');
const request = require('request');
const Nightmare = require('nightmare');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
//const HOST = 'localhost';
const HOST = '192.168.99.100';
const numClients = 5;

if (cluster.isMaster) {
    function mailProc(cb) {
        function regist(id, finishId) {
            console.log(`regist id = ${id} finishId = ${finishId}`);
            request(`http://${HOST}:1080/messages/${id}.plain`, (error, response, body) => {
                if (body) {
                    const lines = body.split(/\n/);
                    let count = 0;
                    let clickCount = 0;
                    for (let line of lines) {
                        //console.log(line)
                        if (line.startsWith('https') && line.indexOf('/entry/activate/') != -1) {
                            clickCount++;
                            request(line, (error, response, body) => {
                                if (error) {
                                    console.error(error);
                                }
                                if (id == finishId) {
                                    console.log(`call cb`);
                                    if (cb) {
                                        cb();
                                    }
                                }
                                
                            });
                        }
                    }
                    if (clickCount < 1) {
                        if (id == finishId) {
                            console.log(`call cb without click`);
                            if (cb) {
                                cb();
                            }
                        }
                    }
                } else {
                    if (id == finishId) {
                        console.log(`call cb with nobody`);
                        if (cb) {
                            cb();
                        }
                    }
                }
                //parseMail(JSON.parse(body));
            });
        }

        function parseMail(json) {
            let finishId = -1;
            for (let i = 0; i < json.length; i++) {
                //console.log(i,json[i]);
                if (json[i].recipients[0] != 'admin@example.com') {
                    finishId = json[i].id;
                }
            }
            if (finishId == -1) {
                if (cb) {
                    cb();
                    return;
                }
            }
            console.log(`finishId = ${finishId}`);
            for (let i = 0; i < json.length; i++) {
                //console.log(i,json[i]);
                if (json[i].recipients[0] != 'admin@example.com') {
                    regist(json[i].id, finishId);
                }
            }
        }
        request(`http://${HOST}:1080/messages`, (error, response, body) => {
            console.log(error);
            //console.log(JSON.parse(body));
            parseMail(JSON.parse(body));
        });
    }

    console.log(`Master ${process.pid} is running`);

    function delayStart(p, num) {
        if (num < 1) {
            console.log(`delayStart finish. p = ${p}`);
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
    delayStart(0, numClients);

    let numProc = 10000;

    let numWokers = numClients;
    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);

        console.log(`numWokers = ${numWokers}, range : ${worker.id}`);
        numWokers = numWokers - 1;
        if (numWokers == 0) {
            //process.exit(0);
            numProc = numProc - 1;
            if (numProc == 1) {
                console.log(`end`);
                mailProc(() => {
                    request({
                            method: 'DELETE',
                            uri: `http://${HOST}:1080/messages`
                        },
                        (error, response, body) => {
                            console.log(`error = ${error}`);
                            console.log(`mail delete.`);
                            process.exit(0);
                        });
                });
            } else {
                mailProc(() => {
                    request({
                            method: 'DELETE',
                            uri: `http://${HOST}:1080/messages`
                        },
                        (error, response, body) => {
                            if (error) {
                                console.log(`error = ${error}`);
                            }
                            console.log(`mail delete.`);
                            console.log(`call delayStart numProc=${numProc} numClients = ${numClients}`);
                            delayStart(numProc, numClients);
                        });
                });
                numWokers = numClients;
            }
        }
    });
} else {
    const nightmare = Nightmare({
        show: false,
        waitTimeout: 10000,
        loadTimeout:10000,
        executionTimeout: 10000,
        typeInterval: 1,
        switches: {
            'ignore-certificate-errors': null
        }
    });

    function preRegist(num) {

        const email = `testu${process.argv.slice(2)}${num}@nergal.lan`;
        console.log(`${process.argv.slice(2)} start num = ${num}`);
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
            .then((result) => {
                //console.log(result);
                console.log(`${process.argv.slice(2)} : ${num} done.`);
                if (num > 0) {
                    preRegist(num - 1);
                } else {
                    //mailProc();
                    nightmare.end()
                        .then((r) => {
                            console.log(r);
                        })
                        .catch((e) => {
                            console.error(e);
                        });
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
                    nightmare.end()
                        .then((r) => {
                            console.log(r);
                        })
                        .catch((e) => {
                            console.error(e);
                        });
                    process.exit(0);
                }

            });
    }
    preRegist(5);
}