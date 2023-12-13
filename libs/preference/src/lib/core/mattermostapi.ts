import axios from 'axios';
import enviornment from '../../enviornment';

async function sendDirectMessage(messageObject : any) {
    const apiUrl = enviornment.mattermost_apis_url;
    try {
        const response = await axios.post(apiUrl, messageObject);
        return response.data;
    } catch (error) {
        console.error('API Error:', error);
        throw error; // You can handle or log the error as per your application's needs
    }
}

export default sendDirectMessage