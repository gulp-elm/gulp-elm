module Test1 exposing (..)

import Html exposing (Html, text)
import String.Interpolate exposing (interpolate)


main : Html msg
main =
    text (interpolate "Hello, {0}!!" [ "World" ])
