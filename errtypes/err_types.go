package errtypes

import (
	"fmt"
)

// ValueError describes an invalid value that was passed to a function.
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
