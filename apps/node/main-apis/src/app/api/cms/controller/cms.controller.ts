import { NextFunction, Request, Response } from 'express';
import { APIResponseFormat } from '@tms-workspace/apis-core';
import CmsService from '../services/cms.service';

class CmsController {
  public cmsService = new CmsService();

  /** Get the content of the page for the called slug. */
  public getCms = async (request: Request, res: Response, next: NextFunction) => {
    const url = request.headers?.url;
    if (url != undefined) {
      try {
        const getResponse = await this.cmsService._getAllData(String(url));
        if (getResponse) {
          res.status(200).json(APIResponseFormat._ResDataFound(getResponse));
        } else {
          res.status(404).json(APIResponseFormat._ResDataNotFound(null));
        }
      } catch (error) {
        next(error);
        return res.status(500).json(APIResponseFormat._ResIntervalServerError(error.message));
      }
    } else {
      res.status(409).json(APIResponseFormat._ResMissingRequiredField('Url'));
    }
  };

  /** Use to add a entry for cms page in table. */
  public createCms = async (request: Request, res: Response, next: NextFunction) => {
    const name = request.body?.name;
    const slug = request.body?.slug;
    const pageTitle = request.body?.page_title;
    const pageContent = request.body?.page_content;
    if (
      name != undefined &&
      slug != undefined &&
      pageTitle != undefined &&
      pageContent != undefined
    ) {
      this.cmsService
        ._createCms(name, slug, pageTitle, pageContent)
        .then((dbResponse) => {
          res.status(200).json(dbResponse);
        })
        .catch((err) => {
          next(err)
          res.status(500).json(APIResponseFormat._ResIntervalServerError(err.message));
        });
    } else {
      res.status(409).json(APIResponseFormat._ResMissingRequiredField('Some fields'));
    }
  };

  /** Use to update a entry for cms in table. */
  public updateCms = async (request: Request, res: Response, next: NextFunction) => {
    if (request.headers.slug != null) {
      const name = request.body?.name;
      const slug = request.body?.slug;
      const pageTitle = request.body?.page_title;
      const pageContent = request.body?.page_content;
      const cmsData = await this.cmsService._getAllData(String(request.headers.slug));
      if (cmsData !== null) {
        if (
          name != undefined &&
          slug != undefined &&
          pageTitle != undefined &&
          pageContent != undefined
        ) {
          const reciveUpdatedData = {
            name: name,
            slug: slug,
            page_title: pageTitle,
            page_content: pageContent,
          };
          this.cmsService
            ._updateCms(reciveUpdatedData, slug)
            .then(() => {
              res.status(200).json(APIResponseFormat._ResDataUpdated('CMS'));
            })
            .catch((err) => {
              next(err)
              res.status(500).json(APIResponseFormat._ResIntervalServerError(err.message));
            });
        } else {
          res.status(409).json(APIResponseFormat._ResMissingRequiredField('Some fields'));
        }
      } else {
        res.status(404).json(APIResponseFormat._ResDataNotFound(null));
      }
    } else {
      res.status(409).json(APIResponseFormat._ResMissingRequiredField('Slug'));
    }
  };

  /** Deleting a cms page. */
  public deleteCms = async (request: Request, res: Response, next: NextFunction) => {
    if (request.headers.slug != null) {
      this.cmsService
        ._deleteCmsPage(String(request.headers.slug))
        .then((response) => {
          res.status(200).json(response);
        })
        .catch((err) => {
          next(err);
          res.status(500).json(APIResponseFormat._ResIntervalServerError(err.message));
        });
    } else {
      res.status(409).json(APIResponseFormat._ResMissingRequiredField('Slug'));
    }
  };
}

export default CmsController;
