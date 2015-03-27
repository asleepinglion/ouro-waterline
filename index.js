/*


  sSSs   .S       S.    .S_sSSs      sSSs   .S_sSSs        .S    sSSs
 d%%SP  .SS       SS.  .SS~YS%%b    d%%SP  .SS~YS%%b      .SS   d%%SP
d%S'    S%S       S%S  S%S   `S%b  d%S'    S%S   `S%b     S%S  d%S'
S%|     S%S       S%S  S%S    S%S  S%S     S%S    S%S     S%S  S%|
S&S     S&S       S&S  S%S    d*S  S&S     S%S    d*S     S&S  S&S
Y&Ss    S&S       S&S  S&S   .S*S  S&S_Ss  S&S   .S*S     S&S  Y&Ss
`S&&S   S&S       S&S  S&S_sdSSS   S&S~SP  S&S_sdSSS      S&S  `S&&S
  `S*S  S&S       S&S  S&S~YSSY    S&S     S&S~YSY%b      S&S    `S*S
   l*S  S*b       d*S  S*S         S*b     S*S   `S%b     d*S     l*S
  .S*P  S*S.     .S*S  S*S         S*S.    S*S    S%S    .S*S    .S*P
sSS*S    SSSbs_sdSSS   S*S          SSSbs  S*S    S&S  sdSSS   sSS*S
YSS'      YSSP~YSSY    S*S           YSSP  S*S    SSS  YSSY    YSS'
                       SP                  SP
                       Y                   Y

           -= Waterline Database Engine Module Loader =-
 */

module.exports.Waterline = require('./modules/waterline/class');
module.exports.Controller = require('./modules/controller/class');
module.exports.Model = require('./modules/model/class');