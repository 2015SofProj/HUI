var fs = require("fs");

function read(f) {
  return fs.readFileSync(f).toString();
}
function include(f) {
  eval.apply(global, [read(f)]);
}

var JsonFormatter = {
        stringify: function (cipherParams) {
            var jsonObj = {
                ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64)
            };

            if (cipherParams.iv) {
                jsonObj.iv = cipherParams.iv.toString();
            }
            if (cipherParams.salt) {
                jsonObj.s = cipherParams.salt.toString();
            }

            return JSON.stringify(jsonObj);
        },

        parse: function (jsonStr) {
            var jsonObj = JSON.parse(jsonStr);

            var cipherParams = CryptoJS.lib.CipherParams.create({
                ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct)
            });

            if (jsonObj.iv) {
                cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv)
            }
            if (jsonObj.s) {
                cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s)
            }

            return cipherParams;
        }
    };



exports.encodeMessage = function(msg){
   include('./lib/aes.js');
   var encrypted = CryptoJS.AES.encrypt(msg, "Emrjdnsrkawk2ro", { format: JsonFormatter });

   return encrypted;
}

exports.decodeMessage = function(encrypted){
    include('./lib/aes.js');
    var decrypted = CryptoJS.AES.decrypt(encrypted, "Emrjdnsrkawk2ro", { format: JsonFormatter });

    return decrypted.toString(CryptoJS.enc.Utf8);
}