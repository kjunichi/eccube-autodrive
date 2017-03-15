const request = require('request');
const Nightmare = require('nightmare');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
//const HOST = 'localhost';
const HOST = '192.168.99.100';

function mailProc() {

    function regist(id) {
        request(`http://${HOST}:1080/messages/${id}.plain`, (error, response, body) => {
            const lines = body.split(/\n/);
            for (let line of lines) {
                //console.log(line)
                if (line.startsWith('https') && line.indexOf('/entry/activate/') != -1) {
                    request(line, (error, response, body) => {
                        //console.log(error);
                        //console.log(response);
                        //console.log(body);
                    });
                    console.log(line);
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
const nightmare = Nightmare({
    show: false,
    switches: {
        'ignore-certificate-errors': null
    }
});

function preRegist(num) {
    console.log(`start num = ${num}`);
    const email = `test2${num}@nergal.lan`;



    nightmare
        .goto(`https://${HOST}:8443/`)
        .click(".member_link li a[href*=\"/entry\"]")
        .wait(400)
        .type("#entry_name_name01", `試験`)
        .type("#entry_name_name02", `太郎`)
        .type("#entry_kana_kana01", "カタカナ")
        .type("#entry_kana_kana02", "カタカナ")
        .type("#zip01", "164")
        .type("#zip02", "0001")
        .click("#zip-search")
        .wait(400)
        .type("#addr02", "試験1-2-3")
        .type("#entry_tel_tel01", "03")
        .type("#entry_tel_tel02", "1234")
        .type("#entry_tel_tel03", "1234")
        .type("#entry_email_first", email)
        .type("#entry_email_second", email)
        .type("#entry_password_first", "abcde123")
        .type("#entry_password_second", "abcde123")
        .click("button.btn-primary")
        .wait(400)
        //.pdf("cube.pdf")
        .click("button.btn-primary")
        .wait(1000)
        .evaluate(() => {
            return document.body.innerHTML;
            //const e1 = document.querySelectorAll('.member_link li');

            //return e1['0'].href;
        })
        .then((result) => {
            //console.log(result);
            console.log(`${num} done.`);
            if (num > 0) {
                preRegist(num - 1);
            } else {
                mailProc();
            }
        })
        .catch((error) => {
            console.error('Search failed:', error);
                        //console.log(result);
            
            if (num > 0) {
                preRegist(num - 1);
            } else {
                mailProc();
            }
        
        });
}

preRegist(7099);
//mailProc();
