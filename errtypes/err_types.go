package errtypes

import (
	"fmt"
)

// ValueError describes an invalid value that was passed to a function
// or assigned to a tag.
type ValueError struct {
	message string
}

// Error returns the error message.
func (err *ValueError) Error() string {
	return err.message
}

// NewValueError creates a new ValueError.
func NewValueError(format string, a ...interface{}) *ValueError {
	return &ValueError{message: fmt.Sprintf(format, a...)}
}

// EmptyError describes an illegal empty value.
// This is used mainly in validating tag values, where
// we want to distinguish between a value that was specified
// but not allowed vs. a value that was not specified at all.
type EmptyError struct {
	message string
}

// Error returns the error message.
func (err *EmptyError) Error() string {
	return err.message
}

// NewEmptyError creates a new EmptyError.
func NewEmptyError(format string, a ...interface{}) *EmptyError {
	return &EmptyError{message: fmt.Sprintf(format, a...)}
}

// RuntimeError describes an invalid value that was passed to a function.
type RuntimeError struct {
	message string
}

// Error returns the error message.
func (err *RuntimeError) Error() string {
	return err.message
}

// NewRuntimeError creates a new RuntimeError.
func NewRuntimeError(format string, a ...interface{}) *RuntimeError {
	return &RuntimeError{message: fmt.Sprintf(format, a...)}
}
