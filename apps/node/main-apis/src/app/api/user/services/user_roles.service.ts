import { iUserRoles } from "../../../database/interface/user.interface";
import _DB from "../../../database/models";

const _userRoles = _DB.UserRoles
const _userWithRole = _DB.UserWithRole

class UserRolesService {
  public _getUserRoles = async() => {
    return new Promise((resolve) => {
      const data = _userRoles.findAll()
        .then(res => res.map(data => ({
          id: data.dataValues.id,
          title: data.dataValues.title
        }))
      )
      resolve(data);
    });
  }

  public _getUserRolesByTitle = async(title: string) => {
    return new Promise((resolve) => {
      const data = _userRoles.findOne({
        where: {
          title
        }
      })
      resolve(data);
    });
  }

  public _getUserRolesById = async(roleId: number) => {
    return new Promise<iUserRoles>((resolve) => {
      const data = _userRoles.findByPk(roleId).then(data => data?.dataValues);
      resolve(data);
    });
  }

  public _createUserRole = async(role: object) => {
    return new Promise((resolve) => {
      const data = _userRoles.create(role);
      resolve(data);
    });
  }

  public _updateUserRolePermission = async(roleId: number, role: object) => {
    return new Promise((resolve) => {
      const data = _userRoles.update(role, {
        where: {
          id: roleId
        }
      })
      resolve(data);
    });
  }

  public _deleteUserRole = async(roleId: number) => {
    return new Promise((resolve) => {
      _userRoles.destroy({
        where: {
          id: roleId
        }
      })
      resolve(true);
    });
  }

  // check if role is assigned to any user
  public _checkUserRole = async(roleId: number) => {
    return new Promise((resolve) => {
      const data = _userWithRole.findOne({
        where: {
          role_id: roleId
        }
      })
      resolve(data);
    });
  }

  public _getUserRolePermission= async() => {
    return new Promise((resolve) => {
      const data = _userRoles.findAll()
      resolve(data);
    });
  }

  // public _updateUserPermission = async(roleId: number, role: object) => {
  //   return new Promise((resolve) => {
  //     const data = _userRoles.update(role, {
  //       where: {
  //         id: roleId
  //       }
  //     })
  //     resolve(data);
  //   });
  // }
}

export default UserRolesService;