export class EnvVars {
  public static dbHost = 'DATABASE_APPLICATION_HOST';
  public static dbPort = 'DATABASE_APPLICATION_PORT';
  public static dbUser = 'DATABASE_APPLICATION_USERNAME';
  public static dbPassword = 'DATABASE_APPLICATION_PASSWORD';
  public static dbSchema = 'DATABASE_APPLICATION_SCHEMA';
  public static dbDatabase = 'DATABASE_APPLICATION_DATABASE';
  public static enviroment = 'NODE_ENV';
  public static secretKey = 'SECRET';
  public static s3AccessKey = 'S3_ACCESS_KEY';
  public static s3SecretAccessKey = 'S3_SECRET_ACCESS_KEY';
  public static s3Bucket = 'S3_BUCKET';
  public static s3Region = 'S3_REGION';
  // File storage configuration
  public static fileStorageType = 'FILE_STORAGE_TYPE'; // 's3' or 'local'
  public static localStoragePath = 'LOCAL_STORAGE_PATH'; // Path for local file storage
  public static baseUrl = 'BASE_URL'; // Base URL for serving local files
}
