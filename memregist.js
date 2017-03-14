const Nightmare = require('nightmare');       
const nightmare = Nightmare({ 
	show: true,
	switches : {'ignore-certificate-errors': null}
});

nightmare
  .goto('https://localhost:8443/')
  .click(".member_link li a[href*=\"/entry\"]")
  .wait(1)
  .type("#entry_name_name01","試験")
  .type("#entry_name_name02","太郎")
  .type("#entry_kana_kana01", "カタカナ")
  .type("#entry_kana_kana02", "カタカナ")
  .type("#zip01","164")
  .type("#zip02","0001")
  .click("#zip-search")
  .wait(1)
  .type("#addr02","試験1-2-3")
  .type("#entry_tel_tel01","03")
  .type("#entry_tel_tel02","1234")
  .type("#entry_tel_tel03", "1234")
  .type("#entry_email_first","test0001@nergal.lan")
  .type("#entry_email_second", "test0001@nergal.lan")
  .type("#entry_password_first","abcde123")
  .type("#entry_password_second", "abcde123")
  .click("button.btn-primary")
  .wait(1)
  .pdf("cube.pdf")
  .click("button.btn-primary")
  .wait(1)
  .evaluate(() => {
      return document.body.innerHTML;
      //const e1 = document.querySelectorAll('.member_link li');

      //return e1['0'].href;
  })
  .end()
  .then((result) => {
      console.log(result);
  })
  .catch((error) => {
      console.error('Search failed:', error);
  });

