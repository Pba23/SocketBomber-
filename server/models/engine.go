package models

import "sync"

// Engine represents an engine.
type Engine[k comparable, v *Team] struct {
	sync.RWMutex
	mapping map[k]v
}

// NewEngine creates a new engine.
func New[k comparable, v *Team]() *Engine[k, v] {
	return &Engine[k, v]{
		mapping: make(map[k]v),
	}
}

// Get returns the value for the given key.
func (e *Engine[k, v]) Get(key k) v {
	e.RLock()
	defer e.RUnlock()
	return e.mapping[key]
}

// Add adds a new key-value pair.
func (e *Engine[k, v]) Add(key k, value v) {
	e.Lock()
	defer e.Unlock()
	e.mapping[key] = value
}

func (e *Engine[k, v]) Update(key k, value v) {
	e.Lock()
	defer e.Unlock()
	e.mapping[key] = value
}   

// Remove removes the key-value pair for the given key.
func (e *Engine[k, v]) Remove(key k) {
	e.Lock()
	defer e.Unlock()
	delete(e.mapping, key)
}

// Keys returns the keys.
func (e *Engine[k, v]) Keys() []k {
	e.RLock()
	defer e.RUnlock()
	keys := make([]k, 0, len(e.mapping))
	for key := range e.mapping {
		keys = append(keys, key)
	}
	return keys
}

// Values returns the values.
func (e *Engine[k, v]) Values() []v {
	e.RLock()
	defer e.RUnlock()
	values := make([]v, 0, len(e.mapping))
	for _, value := range e.mapping {
		values = append(values, value)
	}
	return values
}

// Size returns the number of key-value pairs.
func (e *Engine[k, v]) Size() int {
	e.RLock()
	defer e.RUnlock()
	return len(e.mapping)
}

// Range calls f sequentially for each key and value present in the engine.
// If f returns false, range stops the iteration.
func (e *Engine[k, v]) Range(f func(k, v) bool) {
	e.RLock()
	defer e.RUnlock()
	for key, value := range e.mapping {
		if !f(key, value) {
			break
		}
	}
}
