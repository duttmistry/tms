import enviornment from "../enviornment";

export default {
  URL: enviornment.state == "development" ? 'http://192.168.0.204:3500/' : enviornment.state == "staging" ? 'http://192.168.0.204:3002/' : 'https://tms-production-core-apis.cybercom.in/',
};