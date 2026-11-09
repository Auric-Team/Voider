use std::env;
use std::fs;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::Path;
use voider_core::{analyze_binary, decompile};

fn print_help() {
    println!("Voider Engine & Reverse Engineering Workbench v0.1.0");
    println!("Usage:");
    println!("  voider analyze <binary_path>           Analyze binary and output JSON");
    println!("  voider disasm <binary_path>            Disassemble binary and print assembly");
    println!("  voider decompile <binary_path> [func]  Decompile function(s) into Pseudo-C");
    println!("  voider info <binary_path>              Print binary headers, sections & symbols");
    println!("  voider serve [port] [web_dist_dir]     Launch local Voider Web/API server");
    println!("  voider help                            Show this help menu");
}

fn handle_analyze(path: &str) {
    let bytes = match fs::read(path) {
        Ok(b) => b,
        Err(e) => {
            eprintln!("Error reading file '{}': {}", path, e);
            std::process::exit(1);
        }
    };
    let filename = Path::new(path).file_name().and_then(|s| s.to_str()).unwrap_or("binary");
    match analyze_binary(&bytes, filename) {
        Ok(analysis) => {
            let json = serde_json::to_string_pretty(&analysis).unwrap();
            println!("{}", json);
        }
        Err(e) => {
            eprintln!("Analysis error: {}", e);
            std::process::exit(1);
        }
    }
}

fn handle_disasm(path: &str) {
    let bytes = match fs::read(path) {
        Ok(b) => b,
        Err(e) => {
            eprintln!("Error reading file '{}': {}", path, e);
            std::process::exit(1);
        }
    };
    let filename = Path::new(path).file_name().and_then(|s| s.to_str()).unwrap_or("binary");
    match analyze_binary(&bytes, filename) {
        Ok(analysis) => {
            println!("=== Disassembly for {} ({}) ===", analysis.info.filename, analysis.info.format);
            println!("Entry Point: {:#010x}, Architecture: {}", analysis.info.entry_point, analysis.info.arch);
            println!("---------------------------------------------------------------");
            for insn in &analysis.instructions {
                let cmt = insn.comment.as_ref().map(|c| format!(" ; {}", c)).unwrap_or_default();
                println!("{:#010x}:  {:20} {:<8} {}{}", insn.address, insn.bytes_hex, insn.mnemonic, insn.operands, cmt);
            }
        }
        Err(e) => {
            eprintln!("Analysis error: {}", e);
            std::process::exit(1);
        }
    }
}

fn handle_decompile(path: &str, func_name: Option<&str>) {
    let bytes = match fs::read(path) {
        Ok(b) => b,
        Err(e) => {
            eprintln!("Error reading file '{}': {}", path, e);
            std::process::exit(1);
        }
    };
    let filename = Path::new(path).file_name().and_then(|s| s.to_str()).unwrap_or("binary");
    match analyze_binary(&bytes, filename) {
        Ok(analysis) => {
            if analysis.functions.is_empty() {
                println!("No functions detected in binary.");
                return;
            }
            for func in &analysis.functions {
                if let Some(target) = func_name {
                    if func.name != target {
                        continue;
                    }
                }
                println!("=== Decompilation of {} ({:#010x} - {:#010x}) ===", func.name, func.start_address, func.end_address);
                let decompiled = decompile(func, &analysis.basic_blocks);
                println!("{}", decompiled.signature);
                for line in &decompiled.code_lines {
                    let indent_space = " ".repeat(line.indent * 4);
                    println!("{}{}", indent_space, line.text);
                }
                println!();
            }
        }
        Err(e) => {
            eprintln!("Analysis error: {}", e);
            std::process::exit(1);
        }
    }
}

fn handle_info(path: &str) {
    let bytes = match fs::read(path) {
        Ok(b) => b,
        Err(e) => {
            eprintln!("Error reading file '{}': {}", path, e);
            std::process::exit(1);
        }
    };
    let filename = Path::new(path).file_name().and_then(|s| s.to_str()).unwrap_or("binary");
    match analyze_binary(&bytes, filename) {
        Ok(analysis) => {
            println!("=======================================================");
            println!("  VOIDER BINARY ANALYSIS SUMMARY");
            println!("=======================================================");
            println!("Filename:      {}", analysis.info.filename);
            println!("Format:        {}", analysis.info.format);
            println!("Architecture:  {}", analysis.info.arch);
            println!("Bit Width:     {}", if analysis.info.is_64bit { "64-bit" } else { "32-bit" });
            println!("Endianness:    {}", analysis.info.endianness);
            println!("File Size:     {} bytes", analysis.info.size);
            println!("SHA256:        {}", analysis.info.sha256);
            println!("Entry Point:   {:#010x}", analysis.info.entry_point);
            println!("Base Address:  {:#010x}", analysis.info.base_address);
            println!("Entropy:       {:.4}", analysis.info.overall_entropy);
            println!("\nSections ({}):", analysis.sections.len());
            for sec in &analysis.sections {
                println!("  [{:<12}] {:#010x} - {:#010x}  (perm: {:<4}, entropy: {:.2})", 
                    sec.name, sec.virtual_address, sec.virtual_address + sec.virtual_size, sec.permissions, sec.entropy);
            }
            println!("\nFunctions:     {}", analysis.functions.len());
            println!("Instructions:  {}", analysis.instructions.len());
            println!("Basic Blocks:  {}", analysis.basic_blocks.len());
            println!("Imports:       {}", analysis.imports.len());
            println!("Exports:       {}", analysis.exports.len());
            println!("Strings:       {}", analysis.strings.len());
        }
        Err(e) => {
            eprintln!("Analysis error: {}", e);
            std::process::exit(1);
        }
    }
}

fn handle_serve(port: u16, web_dist: &str) {
    let addr = format!("127.0.0.1:{}", port);
    let listener = match TcpListener::bind(&addr) {
        Ok(l) => l,
        Err(e) => {
            eprintln!("Failed to bind server on {}: {}", addr, e);
            std::process::exit(1);
        }
    };

    println!("=======================================================");
    println!("  VOIDER WORKBENCH SERVER RUNNING");
    println!("  URL: http://{}", addr);
    println!("  Static UI Directory: {}", web_dist);
    println!("  API Endpoint: http://{}/api/analyze (POST)", addr);
    println!("=======================================================");

    for stream in listener.incoming() {
        if let Ok(mut stream) = stream {
            let _ = handle_client(&mut stream, web_dist);
        }
    }
}

fn handle_client(stream: &mut TcpStream, web_dist: &str) -> std::io::Result<()> {
    let mut buffer = [0u8; 8192];
    let bytes_read = stream.read(&mut buffer)?;
    if bytes_read == 0 {
        return Ok(());
    }

    let request = String::from_utf8_lossy(&buffer[..bytes_read]);
    let mut lines = request.lines();
    let req_line = match lines.next() {
        Some(l) => l,
        None => return Ok(()),
    };

    let parts: Vec<&str> = req_line.split_whitespace().collect();
    if parts.len() < 2 {
        return Ok(());
    }

    let method = parts[0];
    let path = parts[1];

    if method == "GET" {
        let file_path = if path == "/" || path.is_empty() {
            format!("{}/index.html", web_dist)
        } else {
            let clean_path = path.trim_start_matches('/');
            format!("{}/{}", web_dist, clean_path)
        };

        if let Ok(content) = fs::read(&file_path) {
            let mime = if file_path.ends_with(".html") {
                "text/html; charset=utf-8"
            } else if file_path.ends_with(".js") {
                "application/javascript"
            } else if file_path.ends_with(".css") {
                "text/css"
            } else if file_path.ends_with(".svg") {
                "image/svg+xml"
            } else {
                "application/octet-stream"
            };

            let response = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: {}\r\nContent-Length: {}\r\nAccess-Control-Allow-Origin: *\r\n\r\n",
                mime,
                content.len()
            );
            stream.write_all(response.as_bytes())?;
            stream.write_all(&content)?;
        } else {
            let fallback = format!("{}/index.html", web_dist);
            if let Ok(content) = fs::read(&fallback) {
                let response = format!(
                    "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nAccess-Control-Allow-Origin: *\r\n\r\n",
                    content.len()
                );
                stream.write_all(response.as_bytes())?;
                stream.write_all(&content)?;
            } else {
                let not_found = "HTTP/1.1 404 NOT FOUND\r\nContent-Length: 9\r\n\r\nNot Found";
                stream.write_all(not_found.as_bytes())?;
            }
        }
    } else {
        let resp = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nVoider API Active";
        stream.write_all(resp.as_bytes())?;
    }

    stream.flush()?;
    Ok(())
}

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        print_help();
        return;
    }

    match args[1].as_str() {
        "analyze" => {
            if args.len() < 3 {
                eprintln!("Usage: voider analyze <binary_path>");
                std::process::exit(1);
            }
            handle_analyze(&args[2]);
        }
        "disasm" => {
            if args.len() < 3 {
                eprintln!("Usage: voider disasm <binary_path>");
                std::process::exit(1);
            }
            handle_disasm(&args[2]);
        }
        "decompile" => {
            if args.len() < 3 {
                eprintln!("Usage: voider decompile <binary_path> [func_name]");
                std::process::exit(1);
            }
            let func = args.get(3).map(|s| s.as_str());
            handle_decompile(&args[2], func);
        }
        "info" => {
            if args.len() < 3 {
                eprintln!("Usage: voider info <binary_path>");
                std::process::exit(1);
            }
            handle_info(&args[2]);
        }
        "serve" => {
            let port = args.get(2).and_then(|s| s.parse::<u16>().ok()).unwrap_or(8080);
            let dist = args.get(3).map(|s| s.as_str()).unwrap_or("./dist");
            handle_serve(port, dist);
        }
        "help" | "--help" | "-h" => {
            print_help();
        }
        other => {
            eprintln!("Unknown command: '{}'", other);
            print_help();
            std::process::exit(1);
        }
    }
}
