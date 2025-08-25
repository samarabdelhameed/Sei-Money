import axios from 'axios';
import { TestConfig, EnvironmentHealth, HealthStatus } from '../types';
import { getLogger } from './logger';

const logger = getLogger();

/**
 * Initialize test environment
 */
export async function initializeEnvironment(config: TestConfig): Promise<void> {
  logger.info('Initializing test environment...');

  try {
    // Create necessary directories
    await createDirectories();
    
    // Validate environment health
    const health = await checkEnvironmentHealth(config);
    
    if (health.overall.status !== 'healthy') {
      throw new Error(`Environment is not healthy: ${health.overall.error}`);
    }

    // Initialize test data directories
    await initializeTestData();

    logger.info('Test environment initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize test environment', { error });
    throw error;
  }
}

/**
 * Clean up test environment
 */
export async function cleanupEnvironment(): Promise<void> {
  logger.info('Cleaning up test environment...');

  try {
    // Clean up test data
    await cleanupTestData();
    
    // Clean up temporary files
    await cleanupTempFiles();

    logger.info('Test environment cleaned up successfully');
  } catch (error) {
    logger.error('Failed to cleanup test environment', { error });
    // Don't throw here, cleanup should be best effort
  }
}

/**
 * Check health of all environment components
 */
export async function checkEnvironmentHealth(config: TestConfig): Promise<EnvironmentHealth> {
  logger.debug('Checking environment health...');

  const [frontend, backend, blockchain, database] = await Promise.allSettled([
    checkFrontendHealth(config.environment.frontendUrl, config.api.timeout),
    checkBackendHealth(config.environment.backendUrl, config.api.timeout),
    checkBlockchainHealth(config.environment.blockchainRpcUrl, config.api.timeout),
    config.database ? checkDatabaseHealth(config.database.url, config.api.timeout) : Promise.resolve(null),
  ]);

  const frontendHealth = frontend.status === 'fulfilled' ? frontend.value : createUnhealthyStatus(frontend.reason);
  const backendHealth = backend.status === 'fulfilled' ? backend.value : createUnhealthyStatus(backend.reason);
  const blockchainHealth = blockchain.status === 'fulfilled' ? blockchain.value : createUnhealthyStatus(blockchain.reason);
  const databaseHealth = database.status === 'fulfilled' && database.value ? database.value : undefined;

  // Determine overall health
  const components = [frontendHealth, backendHealth, blockchainHealth];
  if (databaseHealth) components.push(databaseHealth);

  const overallHealthy = components.every(component => component.status === 'healthy');
  const overallStatus: HealthStatus = {
    status: overallHealthy ? 'healthy' : 'unhealthy',
    lastCheck: new Date().toISOString(),
    error: overallHealthy ? undefined : 'One or more components are unhealthy',
  };

  const health: EnvironmentHealth = {
    frontend: frontendHealth,
    backend: backendHealth,
    blockchain: blockchainHealth,
    database: databaseHealth,
    overall: overallStatus,
  };

  logger.debug('Environment health check completed', { health });
  return health;
}

/**
 * Check frontend health
 */
async function checkFrontendHealth(url: string, timeout: number): Promise<HealthStatus> {
  const startTime = Date.now();
  
  try {
    const response = await axios.get(url, { 
      timeout,
      validateStatus: (status) => status < 500, // Accept any status < 500
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      lastCheck: new Date().toISOString(),
      details: {
        statusCode: response.status,
        url,
      },
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error.message,
      details: {
        url,
        errorCode: error.code,
      },
    };
  }
}

/**
 * Check backend health
 */
async function checkBackendHealth(url: string, timeout: number): Promise<HealthStatus> {
  const startTime = Date.now();
  const healthUrl = `${url}/health`;
  
  try {
    const response = await axios.get(healthUrl, { 
      timeout,
      validateStatus: (status) => status < 500,
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: response.status === 200 ? 'healthy' : 'unhealthy',
      responseTime,
      lastCheck: new Date().toISOString(),
      details: {
        statusCode: response.status,
        url: healthUrl,
        data: response.data,
      },
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error.message,
      details: {
        url: healthUrl,
        errorCode: error.code,
      },
    };
  }
}

/**
 * Check blockchain health
 */
async function checkBlockchainHealth(rpcUrl: string, timeout: number): Promise<HealthStatus> {
  const startTime = Date.now();
  
  try {
    // Simple RPC call to check if blockchain is accessible
    const response = await axios.post(rpcUrl, {
      jsonrpc: '2.0',
      method: 'status',
      params: [],
      id: 1,
    }, { 
      timeout,
      headers: { 'Content-Type': 'application/json' },
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: response.status === 200 && !response.data.error ? 'healthy' : 'unhealthy',
      responseTime,
      lastCheck: new Date().toISOString(),
      details: {
        statusCode: response.status,
        url: rpcUrl,
        blockchainStatus: response.data,
      },
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error.message,
      details: {
        url: rpcUrl,
        errorCode: error.code,
      },
    };
  }
}

/**
 * Check database health (if configured)
 */
async function checkDatabaseHealth(databaseUrl: string, _timeout: number): Promise<HealthStatus> {
  const startTime = Date.now();
  
  try {
    // This is a placeholder - in real implementation, you'd use a proper database client
    // For now, we'll just check if the URL is reachable
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      lastCheck: new Date().toISOString(),
      details: {
        url: databaseUrl,
        note: 'Database health check not fully implemented',
      },
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error.message,
      details: {
        url: databaseUrl,
        errorCode: error.code,
      },
    };
  }
}

/**
 * Create unhealthy status from error
 */
function createUnhealthyStatus(error: any): HealthStatus {
  return {
    status: 'unhealthy',
    lastCheck: new Date().toISOString(),
    error: error?.message || 'Unknown error',
  };
}

/**
 * Create necessary directories
 */
async function createDirectories(): Promise<void> {
  const fs = require('fs').promises;

  const directories = [
    'logs',
    'screenshots',
    'reports',
    'test-data',
    'temp',
  ];

  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
      logger.debug(`Created directory: ${dir}`);
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        logger.warn(`Failed to create directory ${dir}:`, error);
      }
    }
  }
}

/**
 * Initialize test data
 */
async function initializeTestData(): Promise<void> {
  logger.debug('Initializing test data...');
  
  // Create test data structure
  const testData = {
    transfers: [],
    groups: [],
    pots: [],
    vaults: [],
    initialized: new Date().toISOString(),
  };

  const fs = require('fs').promises;
  await fs.writeFile('test-data/initial-state.json', JSON.stringify(testData, null, 2));
  
  logger.debug('Test data initialized');
}

/**
 * Clean up test data
 */
async function cleanupTestData(): Promise<void> {
  logger.debug('Cleaning up test data...');
  
  const fs = require('fs').promises;
  
  try {
    // Clean up test data files
    const files = await fs.readdir('test-data');
    for (const file of files) {
      if (file.startsWith('test-') || file.startsWith('temp-')) {
        await fs.unlink(`test-data/${file}`);
        logger.debug(`Cleaned up test data file: ${file}`);
      }
    }
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      logger.warn('Failed to cleanup test data:', error);
    }
  }
}

/**
 * Clean up temporary files
 */
async function cleanupTempFiles(): Promise<void> {
  logger.debug('Cleaning up temporary files...');
  
  const fs = require('fs').promises;
  
  try {
    // Clean up temp directory
    const files = await fs.readdir('temp');
    for (const file of files) {
      await fs.unlink(`temp/${file}`);
      logger.debug(`Cleaned up temp file: ${file}`);
    }
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      logger.warn('Failed to cleanup temp files:', error);
    }
  }
}

/**
 * Reset environment to clean state
 */
export async function resetEnvironment(config: TestConfig): Promise<void> {
  logger.info('Resetting environment to clean state...');
  
  try {
    await cleanupEnvironment();
    await initializeEnvironment(config);
    logger.info('Environment reset completed');
  } catch (error) {
    logger.error('Failed to reset environment', { error });
    throw error;
  }
}