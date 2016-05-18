module Test2 exposing (..)

import Text exposing (fromString)
import Element exposing (tag, leftAligned, toHtml)


main =
    toHtml <| tag "hello" <| leftAligned <| fromString "Test"
