
// Require our core node libraries.
var filesystem = require( "fs" );

// Require our application libraries.
var createAppError = require( "../util/app-error" ).createAppError;


// Export the factory function.
exports.createFileWriter = createFileWriter;

// Export the constructor function.
exports.FileWriter = FileWriter;


// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //


// I create an instance of the file writer.
function createFileWriter( logDirectory, filenameBase, filenameExtension ) {

	return( new FileWriter( logDirectory, filenameBase, filenameExtension ) );

}


// I implement the writer interface, writing messages to the filesystem. The log files 
// are automatically rotated based on the rotation settings (day, hour, minute).
function FileWriter( logDirectory, filenameBase, filenameExtension ) {

	// As we rotate logs, we need to keep track of this file we are streaming to.
	this._currentWriteStream = null;
	this._currentFilename = null;

	// Keep track of where we are logging files and what type of file they are.
	this.setLogDirectory( logDirectory );
	this.setFilenameBase( filenameBase );
	this.setFilenameExtension( filenameExtension );

	// By default, let's use day-base rotation.
	this.enableDayRotation();

}


// Configure "class" methods.
FileWriter.prototype = {

	// ---
	// PUBLIC METHODS.
	// ---


	// I enable the rotation-by-day strategy.
	enableDayRotation: function() {

		this._rotationStrategy = "D";

	},


	// I enable the rotation-by-hour strategy.
	enableHourRotation: function() {

		this._rotationStrategy = "H";

	},


	// I enable the rotation-by-minute strategy.
	enableMinuteRotation: function() {

		this._rotationStrategy = "M";

	},


	// I set the filename prefix to be used when generating log files. The filename base
	// will be followed automatically by a date stamp.
	setFilenameBase: function( newFilenameBase ) {

		this.testFilenameBase( newFilenameBase );

		this._filenameBase = newFilenameBase;

	},


	// I set the file extension to be used when generating log files.
	// --
	// NOTE: The we do not do any validation on the content of the messages. It is up to
	// the calling context to ensure that the content format aligns properly with the 
	// file extension being used.
	setFilenameExtension: function( newFilenameExtension ) {

		this.testFilenameExtension( newFilenameExtension );

		this._filenameExtension = newFilenameExtension;

	},


	// I set the directory path in which the logs are stored.
	setLogDirectory: function( newLogDirectory ) {

		this.testLogDirectory( newLogDirectory );

		this._logDirectory = newLogDirectory;

	},


	// I test the filename base to make sure it is valid. If it is valid, I return 
	// quietly; if not, I throw an error.
	testFilenameBase: function( newFilenameBase ) {

		if ( ! newFilenameBase ) {

			throw(
				createAppError({
					type: "App.IllegalArgument",
					message: "Filename base was not provided."
				})
			);

		}

	},


	// I test the file extensions to make sure it is valid. If it is valid, I return 
	// quietly; if not, I throw an error.
	testFilenameExtension: function( newFilenameExtension ) {

		if ( ! newFilenameExtension ) {

			throw(
				createAppError({
					type: "App.IllegalArgument",
					message: "File extension was not provided."
				})
			);

		}

	},


	// I test the log directory to make sure it is valid. If it is valid, I return 
	// quietly; if not, I throw an error.
	testLogDirectory: function( newLogDirectory ) {

		if ( ! newLogDirectory ) {

			throw(
				createAppError({
					type: "App.IllegalArgument",
					message: "Logging directory was not provided."
				})
			);

		}

		if ( newLogDirectory.slice( -1 ) !== "/" ) {

			throw(
				createAppError({
					type: "App.IllegalArgument",
					message: "Log directory path must end with slash.",
					detail: util.format( "The log directory path [%s] must end with [/].", newLogDirectory )
				})
			);

		}

	},


	// I enable the day-wise log rotation strategy. Returns [this] reference for 
	// method chaining.
	withDayRotation: function() {

		this.enableDayRotation();

		return( this );

	},


	// I enable the hour-wise log rotation strategy. Returns [this] reference for 
	// method chaining.
	withHourRotation: function() {

		this.enableHourRotation();

		return( this );

	},


	// I enable the minute-wise log rotation strategy. Returns [this] reference for 
	// method chaining.
	withMinuteRotation: function() {

		this.enableMinuteRotation();

		return( this );

	},


	// I write the given message to the filesystem.
	write: function( message ) {

		this._getFileStream().write( message + "\n" );

	},


	// ---
	// PRIVATE METHODS.
	// ---


	// I ensure that the given value is two digits. If it is not, a "0" is prepended.
	_ensureTwoDigits: function( value ) {

		if ( String( value ).length === 1 ) {

			return( "0" + value );

		}

		return( value );

	},


	// I return the file-write stream that points to the current log file. This will
	// also close the existing log file if the log needs to be rotated.
	_getFileStream: function() {

		var targetFilename = this._getTimeOrientedFilename( new Date() );

		// If the log file needs to be rotated, create the new stream.
		if ( targetFilename !== this._currentFilename ) {

			// Close the previous stream, if it exists.
			if ( this._currentWriteStream ) {

				this._currentWriteStream.close();

			}

			this._currentFilename = targetFilename;
			this._currentWriteStream = filesystem.createWriteStream(
				( this._logDirectory + this._currentFilename ),
				{
					flags: "a"
				}
			);

		}

		return( this._currentWriteStream );

	},


	// I return the name of the log file we should be using based on the given time.
	// This takes the rotation strategy into account and only generates a filename 
	// that is as specific as it needs to be.
	_getTimeOrientedFilename: function( now ) {

		var parts = [];

		parts.push( this._filenameBase );
		parts.push( "_" );
		parts.push( now.getUTCFullYear() );
		parts.push( "_" );
		parts.push( this._ensureTwoDigits( now.getUTCMonth() ) );
		parts.push( "_" );
		parts.push( this._ensureTwoDigits( now.getUTCDate() ) );

		// If we need to get more granular than Day, include hour.
		if ( this._rotationStrategy !== "D" ) {

			parts.push( "_" );
			parts.push( this._ensureTwoDigits( now.getUTCHours() ) );

			// If we need to get more granular than Hour, include minute.
			if ( this._rotationStrategy !== "H" ) {

				parts.push( "_" );
				parts.push( this._ensureTwoDigits( now.getUTCMinutes() ) );
				
			}
			
		}

		parts.push( "." );
		parts.push( this._filenameExtension );

		return( parts.join( "" ) );

	}

};
