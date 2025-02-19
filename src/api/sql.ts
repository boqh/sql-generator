import request from "@/utils/request";

// SQL 记录接口定义
export interface SqlRecord {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: null | string;
  sql_name: string;
  sql_parameters: string;
  description: string; // 添加 Description 字段
}

// API 响应接口定义
export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

// 保存 SQL 的参数接口
export interface SaveSqlParams {
  sqlName: string;
  sqlParameters: string;
  description: string; // 修改为必填字段
}

/**
 * 保存 SQL
 * @param data SQL 数据
 * @returns Promise<ApiResponse>
 */
export const saveSQL = (data: SaveSqlParams) => {
  return request.post<ApiResponse<null>>("/save-sql", {
    sql_name: data.sqlName,
    sql_parameters: data.sqlParameters,
    description: data.description, // 修改字段名以匹配后端
  });
};

/**
 * 搜索 SQL
 * @param name SQL 名称关键字
 * @returns Promise<ApiResponse<SqlRecord[]>>
 */
export const searchSQL = (name: string) => {
  return request.get<ApiResponse<SqlRecord[]>>("/search-sql", {
    params: { name },
  });
};

/**
 * 获取所有 SQL 名称
 * @returns Promise<ApiResponse<string[]>>
 */
export const getSQLNames = () => {
  return request.get<ApiResponse<string[]>>("/sql-names");
};

/**
 * 根据名称获取 SQL
 * @param name SQL 名称
 * @returns Promise<ApiResponse<SqlRecord>>
 */
export const getSQLByName = (name: string) => {
  return request.get<ApiResponse<SqlRecord>>("/get-sql", {
    params: { name },
  });
};

/**
 * 获取所有 SQL 列表
 * @returns Promise<ApiResponse<SqlRecord[]>>
 */
export const getSQLList = () => {
  return request.get<ApiResponse<SqlRecord[]>>("/sql-list");
};

/**
 * 生成 SQL
 * @param data JSON 数据
 * @returns Promise<ApiResponse<string>>
 */
export const generateSQL = (data: any) => {
  return request.post<ApiResponse<string>>("/generate-sql", data);
};

/**
 * 生成 SQL
 * @param data JSON 数据
 * @returns Promise<ApiResponse<string>>
 */
export const getSavedExamples = () => {
  return request.get<ApiResponse<string>>("/sql-list");
};

/**
 * 搜索 SQL
 * @param name SQL 名称关键字
 * @returns Promise<ApiResponse<SqlRecord[]>>
 */
export const deleteSQL = (ID: number) => {
  return request.get<ApiResponse<SqlRecord[]>>("/search-sql", {
    params: { ID },
  });
};
