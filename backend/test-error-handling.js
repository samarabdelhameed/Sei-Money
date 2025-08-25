const { BlockchainErrorHandler } = require('./dist/lib/blockchain-error-handler');
const { ErrorTranslationService } = require('./dist/services/errorTranslationService');

// Test blockchain error handling
console.log('Testing Blockchain Error Handler...\n');

// Test insufficient funds error
const insufficientFundsError = new Error('insufficient funds for gas');
const userFriendlyError = BlockchainErrorHandler.categorizeError(insufficientFundsError);
console.log('Insufficient Funds Error:');
console.log('- Type:', userFriendlyError.type);
console.log('- Message:', userFriendlyError.message);
console.log('- Suggestion:', userFriendlyError.suggestion);
console.log('- Retryable:', userFriendlyError.retryable);
console.log();

// Test network timeout error
const timeoutError = new Error('timeout of 5000ms exceeded');
const timeoutUserFriendlyError = BlockchainErrorHandler.categorizeError(timeoutError);
console.log('Timeout Error:');
console.log('- Type:', timeoutUserFriendlyError.type);
console.log('- Message:', timeoutUserFriendlyError.message);
console.log('- Suggestion:', timeoutUserFriendlyError.suggestion);
console.log('- Retryable:', timeoutUserFriendlyError.retryable);
console.log();

// Test error translation
const translation = ErrorTranslationService.translateError(userFriendlyError);
console.log('Error Translation:');
console.log('- Title:', translation.title);
console.log('- Message:', translation.message);
console.log('- Severity:', translation.severity);
console.log('- Category:', translation.category);
console.log('- Actions:', translation.actions.map(a => a.label).join(', '));
console.log();

// Test retry mechanism
console.log('Testing retry mechanism...');
let attempts = 0;
const testOperation = async () => {
  attempts++;
  if (attempts < 3) {
    throw new Error('Network connection failed');
  }
  return 'Success!';
};

BlockchainErrorHandler.withRetry(testOperation, { maxRetries: 3 })
  .then(result => {
    console.log('Retry test result:', result);
    console.log('Total attempts:', attempts);
  })
  .catch(error => {
    console.log('Retry test failed:', error.message);
  });

console.log('\nError handling test completed!');