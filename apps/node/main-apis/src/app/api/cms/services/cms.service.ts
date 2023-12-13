import _DB from '../../../database/models';

const cmsModel = _DB.CMS;

class CmsService {
  // GET ALL DATA
  public _getAllData = async (slug: string) => {
    return new Promise(async (resolve, reject) => {
      await cmsModel
        .findAll({
          where: {
            slug: slug,
          },
        })
        .then((data) => {
          if (data.length > 0) {
            resolve(data);
          } else {
            resolve(null);
          }
        });
    });
  };

  // Create a cms page.
  public _createCms = async (name: string, slug: string, pageTitle: string, pageContent: Text) => {
    return new Promise(async (resolve, reject) => {
      const newDoc = await cmsModel.create({
        name: name,
        slug: slug,
        page_title: pageTitle,
        page_content: pageContent,
      });
      try {
        const data = newDoc;
        const resp = {
          message: 'Cms added succesfully.',
          status: 200,
          data: {
            id: data.id,
            title: data.dataValues.page_title,
            slug: data.dataValues.slug,
            pageContent: data.dataValues.page_content,
          },
        };
        resolve(resp);
      } catch (error) {
        console.log('error ---->> ', error);
      }
    });
  };

  /** Used to update the project document. */
  public _updateCms = async (reciveUpdateddData: object, slug: string) => {
    return new Promise(async (resolve, reject) => {
      await cmsModel
        .update(reciveUpdateddData, {
          where: {
            slug: slug,
          },
        })
        .then((resp) => {
          resolve(resp);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  /** Delete a project document single record. */
  public _deleteCmsPage = async (slug: string) => {
    return new Promise(async (resolve, reject) => {
      await cmsModel
        .destroy({
          where: {
            slug: slug,
          },
        })
        .then((response) => {
          let deleteResponse: object;
          if (response === 0) {
            deleteResponse = {
              message: 'No record found to be delete.',
              status: 200,
            };
          } else {
            deleteResponse = {
              message: 'Cms page deleted succesfully.',
              status: 200,
            };
          }
          resolve(deleteResponse);
        });
    });
  };
}

export default CmsService;
