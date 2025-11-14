"""
Logging configuration using loguru for structured logging.
"""
import sys
from loguru import logger
from app.config import settings


def setup_logger():
    """Configure loguru logger with file and console handlers"""
    
    # Remove default handler
    logger.remove()
    
    # Console handler with colors
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level=settings.log_level,
        colorize=True,
    )
    
    # File handler for all logs
    logger.add(
        settings.log_file,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level=settings.log_level,
        rotation="10 MB",
        retention="7 days",
        compression="zip",
    )
    
    # Error-only file handler
    logger.add(
        settings.log_file.replace(".log", "_error.log"),
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}\n{exception}",
        level="ERROR",
        rotation="10 MB",
        retention="30 days",
        compression="zip",
        backtrace=True,
        diagnose=True,
    )
    
    logger.info("Logger initialized", level=settings.log_level)
    return logger


def log_assert(condition: bool, message: str, **kwargs):
    """Assert with logging"""
    if not condition:
        logger.error(f"Assertion failed: {message}", **kwargs)
        raise AssertionError(f"Assertion failed: {message}")


def debug_assert(condition: bool, message: str, **kwargs):
    """Debug assertion (only in debug mode)"""
    if settings.debug and not condition:
        logger.warning(f"Debug assertion failed: {message}", **kwargs)
        raise AssertionError(f"Debug assertion failed: {message}")


# Initialize logger on module import
setup_logger()

