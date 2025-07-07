package main

import (
	"fmt"
	"os"

	"github.com/jack-cordery/mirai/internal"
)

func main() {
	db := os.Getenv("DATABASE_URL")
	fmt.Printf("serving to 8000 using dbUrl: %s", db)
	internal.SetupServer()
}
