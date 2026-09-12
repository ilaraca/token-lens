# Audit Pair requires three legs

An Audit Pair is Token (user-supplied On-Chain Id + Market Alias) + legible Document + Market Snapshot at one instant. Missing any leg means there is no Pair and no Audit Report — including no “partial” document-only report in v1. That contradicts the instinct to always return something when the market API fails, but partial output would break the product promise that Findings like Pending Dilution are anchored to a complete, reproducible triple of sources.
