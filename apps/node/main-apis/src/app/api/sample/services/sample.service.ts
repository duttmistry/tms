import { iSample } from '../../../database/interface/sample.interface';
import _DB from '../../../database/models';

const sample = _DB.Sample;

class SampleService {
  // GET ALL DATA
  public _getAllData = async () => {
    return new Promise((resolve, reject) => {
      const data: Promise<iSample[]> = sample.findAll();
      resolve(data);
    });
  };
}

export default SampleService;
