
// Require our core node modules.
var util = require( "util" );


// Export the factory function.
exports.createAppError = createAppError;

// Export the constructor function.
exports.AppError = AppError;


// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //


// I create the new instance of the AppError object.
function createAppError( settings ) {

	// NOTE: We are overriding the "implementationContext" so that the createAppError()
	// function is not part of the resulting stack trace.
	return( new AppError( settings, createAppError ) );

}


// I am the custom error object for the application. The settings is a hash of optional
// properties for the error instance:
// --
// * type: I am the type of error being thrown.
// * message: I am the reason the error is being thrown.
// * detail: I am an explanation of the error.
// * extendedInfo: I am additional information about the error context.
// * errorCode: I am a custom error code associated with this type of error.
// * rootCause: I am the original error that caused this error to be created.
// --
// NOTE: The implementationContext argument is an optional argument that can be used to 
// trim the generated stack trace. If not provided, it defaults to AppError.
function AppError( settings, implementationContext ) {

	// Ensure that settings exists to prevent reference errors.
	settings = ( settings || {} );

	// Override the default name property (Error). This is basically zero value-add.
	this.name = "AppError";

	// Since I am used to ColdFusion, I am modeling the custom error structure on the
	// CFThrow functionality. Each of the following properties can be optionally passed-
	// in as part of the Settings argument.
	// --
	// See CFThrow documentation: https://wikidocs.adobe.com/wiki/display/coldfusionen/cfthrow
	this.type = ( settings.type || "Application" );
	this.message = ( settings.message || "An error occurred." );
	this.detail = ( settings.detail || "" );
	this.extendedInfo = ( settings.extendedInfo || "" );
	this.errorCode = ( settings.errorCode || "" );

	// The rootCause is an optional error object that be passed along in the Catch block.
	// This allows an underlying error to be directly associated with the custom error.
	this.rootCause = ( settings.rootCause || null );

	// This is just a flag that will indicate if the error is a custom AppError. If this
	// is not an AppError, this property will be undefined, which is a Falsey.
	this.isAppError = true;

	// Capture the current stack trace and store it in the property "this.stack". By
	// providing the implementationContext argument, we will remove the current
	// constructor (or the optional factory function) line-item from the stack trace; 
	// this is good because it will reduce the implementation noise in the stack property.
	// --
	// Rad More: https://code.google.com/p/v8-wiki/wiki/JavaScriptStackTraceApi#Stack_trace_collection_for_custom_exceptions
	Error.captureStackTrace( this, ( implementationContext || AppError ) );

}

util.inherits( AppError, Error );
