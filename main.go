package main

import "fmt"

// Add adds two integers
func Add(a, b int) int {
    return a + b
}

func main() {
    fmt.Println("3 + 5 =", Add(3, 5))
}
