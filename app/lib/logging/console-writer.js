
// Require our core node libraries.
var util = require( "util" );


// Export the factory function.
exports.createConsoleWriter = createConsoleWriter;

// Export the constructor function.
exports.ConsoleWriter = ConsoleWriter;


// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //


// I create an instance of the console writer.
function createConsoleWriter() {

	return( new ConsoleWriter() );

}


// I implement the witer interface, writing messages to the console.
function ConsoleWriter() {

	// ...

}


// Configure "class" methods.
ConsoleWriter.prototype = {

	// ---
	// PUBLIC METHODS.
	// ---


	// I write the given message to the console, including the date/time of the message.
	write: function( message ) {

		util.log( message );

	}

};
