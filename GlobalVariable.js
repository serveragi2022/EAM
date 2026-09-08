let name = '';
let username = '';
let userid = '';
let password = '';
let version = '2.9';
let branch = '';
let department = '';
let ipaddress = '';
let devicename = '';
let accessbranch = '';
let accesssubbranch = '';
let accessmodule = '';
let accessdept = '';
let accesssubdept = '';

let empId = '';

let accessdept_es = '';
let accesssubdept_es = '';

export const getGVersion = () => {
  return version;
};

export const setGName = (newName) => {
  name = newName;
};

export const getGName = () => {
  return name;
};

export const setGDepartment = (newDepartment) => {
  department = newDepartment;
};

export const getGDepartment = () => {
  return department;
};

export const setGIpAddress = (newIpAddress) => {
  ipaddress = newIpAddress;
};

export const getGIpAddress = () => {
  return ipaddress;
};

export const setGDeviceName = (newDeviceName) => {
  devicename = newDeviceName;
};

export const getGDeviceName = () => {
  return devicename;
};

export const setGBranch = (newBranch) => {
    branch = newBranch;
  };
  
  export const getGBranch= () => {
    return branch;
  };

  export const setEmpId = (newEmpId) => {
    empId = newEmpId;
  };
  
  export const getEmpId= () => {
    return empId;
  };

  export const setGAccessDept = (newAccessDept) => {
    accessdept = newAccessDept;
  };
  
  export const getGAccessDept= () => {
    return accessdept;
  };

  export const setGAccessSubDept = (newAccessSubDept) => {
    accesssubdept = newAccessSubDept;
  };
  
  export const getGAccessSubDept= () => {
    return accesssubdept;
  };


  export const setGAccessDeptEs = (newAccessDeptEs) => {
    accessdept_es = newAccessDeptEs;
  };
  
  export const getGAccessDeptEs= () => {
    return accessdept_es;
  };

  export const setGAccessSubDeptEs = (newAccessSubDeptEs) => {
    accesssubdept_es = newAccessSubDeptEs;
  };
  
  export const getGAccessSubDeptEs= () => {
    return accesssubdept_es;
  };



  export const setGAccessBranch = (newAccessBranch) => {
    accessbranch = newAccessBranch;
  };
  
  export const getGAccessBranch= () => {
    return accessbranch;
  };

  
  export const setGAccessSubBranch = (newAccessSubBranch) => {
    accesssubbranch = newAccessSubBranch;
  };
  
  export const getGAccessSubBranch= () => {
    return accesssubbranch;
  };


  export const setGAccessModule = (newAccessModule) => {
    accessmodule = newAccessModule;
  };
  
  export const getGAccessModule= () => {
    return accessmodule;
  };

export const setGUserName = (newUserName) => {
  username = newUserName;
};

export const getGUserName = () => {
  return username;
};

export const setGUserId = (newUserId) => {
  userid = newUserId;
};

export const getGUserId = () => {
  return userid;
};

export const setGPassword = (newPassword) => {
  password = newPassword;
};

export const getGPassword = () => {
  return password;
};